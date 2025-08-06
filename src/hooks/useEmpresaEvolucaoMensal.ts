
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EvolucaoMensalData {
  mes: string;
  funcionarios: number;
  custo: number;
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

      // CORREÇÃO: Usar a função principal que já tem a lógica de evolução mensal corrigida
      const { data, error } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (error) {
        console.error('❌ [useEmpresaEvolucaoMensal] Erro ao buscar dados do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log('📊 [useEmpresaEvolucaoMensal] Dashboard data raw:', data);

      // CORREÇÃO: Extrair os dados de evolução mensal da resposta principal
      const typedData = data as any;
      const evolucaoMensal = typedData?.evolucaoMensal || [];
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
