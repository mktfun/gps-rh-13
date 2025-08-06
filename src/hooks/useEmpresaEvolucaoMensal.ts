
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EvolucaoMensalData {
  mes: string;
  funcionarios: number;
  custo: number;
}

export const useEmpresaEvolucaoMensal = (timePeriod: number = 6) => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-evolucao-mensal', empresaId, timePeriod],
    queryFn: async (): Promise<EvolucaoMensalData[]> => {
      console.log('🔍 [useEmpresaEvolucaoMensal] Buscando evolução mensal da empresa:', empresaId, 'período:', timePeriod);

      if (!empresaId) {
        console.error('❌ [useEmpresaEvolucaoMensal] Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      const { data, error } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { 
          p_empresa_id: empresaId,
          p_months: timePeriod 
        }
      );

      if (error) {
        console.error('❌ [useEmpresaEvolucaoMensal] Erro ao buscar dados do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log('📊 [useEmpresaEvolucaoMensal] Dashboard data raw:', data);

      const typedData = data as any;
      const evolucaoMensal = typedData?.evolucaoMensal || [];
      console.log('📈 [useEmpresaEvolucaoMensal] Evolução mensal extraída:', evolucaoMensal);

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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
