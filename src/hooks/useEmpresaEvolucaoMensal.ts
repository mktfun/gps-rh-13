
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Este é o "contrato" que diz ao TypeScript como são os dados de DENTRO do objeto retornado pela RPC
interface EvolucaoMensalData {
  mes: string;
  funcionarios: number;
  custo: number;
}

// Este é o "contrato" para a RESPOSTA COMPLETA da sua função RPC
interface DashboardMetricsResponse {
  evolucaoMensal: EvolucaoMensalData[];
  // Adicione aqui outras propriedades que sua RPC retorna, se houver
}

export const useEmpresaEvolucaoMensal = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-evolucao-mensal', empresaId],
    queryFn: async (): Promise<EvolucaoMensalData[]> => {
      console.log('🔍 [useEmpresaEvolucaoMensal] Buscando evolução mensal da empresa:', empresaId);

      if (!empresaId) {
        console.error('❌ [useEmpresaEvolucaoMensal] Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      // AGORA VOCÊ USA O CONTRATO, PASSANDO ELE COMO UM GENÉRICO PARA A FUNÇÃO RPC
      const { data, error } = await supabase.rpc<DashboardMetricsResponse>(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (error) {
        console.error('❌ [useEmpresaEvolucaoMensal] Erro ao buscar dados do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log('📊 [useEmpresaEvolucaoMensal] Dashboard data raw:', data);

      // COM O TIPO CORRETO, O TYPESCRIPT SABE QUE 'data.evolucaoMensal' EXISTE E É UM ARRAY.
      // CHEGA DE ERROS.
      const evolucaoMensal = data?.evolucaoMensal || [];
      console.log('📈 [useEmpresaEvolucaoMensal] Evolução mensal extraída:', evolucaoMensal);

      // CORREÇÃO: Garantir que os dados estão no formato correto
      const dadosFormatados = Array.isArray(evolucaoMensal) 
        ? evolucaoMensal.map((item: any) => ({
            mes: String(item.mes || ''),
            funcionarios: Number(item.funcionarios || 0),
            custo: Number(item.custo || 0)
          }))
        : [];

      console.log('✅ [useEmpresaEvolucaoMensal] Dados formatados para o gráfico:', dadosFormatados);

      return dadosFormatados;
    },
    enabled: !!empresaId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
