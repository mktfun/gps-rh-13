
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DistribuicaoCargoData {
  cargo: string;
  count: number;
}

export const useEmpresaDistCargos = (timePeriod: number = 6) => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dist-cargos', empresaId, timePeriod],
    queryFn: async (): Promise<DistribuicaoCargoData[]> => {
      console.log('🔍 [useEmpresaDistCargos] Buscando distribuição de cargos da empresa:', empresaId, 'período:', timePeriod);

      if (!empresaId) {
        console.error('❌ [useEmpresaDistCargos] Empresa ID não encontrado');
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
        console.error('❌ [useEmpresaDistCargos] Erro ao buscar dados do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log('📊 [useEmpresaDistCargos] Dashboard data raw:', data);

      const typedData = data as any;
      const distribuicaoCargos = typedData?.distribuicaoCargos || [];
      console.log('👥 [useEmpresaDistCargos] Distribuição de cargos extraída:', distribuicaoCargos);

      const dadosFormatados = Array.isArray(distribuicaoCargos) 
        ? distribuicaoCargos.map((item: any) => ({
            cargo: String(item.cargo || ''),
            count: Number(item.count || 0)
          }))
        : [];

      console.log('✅ [useEmpresaDistCargos] Dados formatados:', dadosFormatados);

      return dadosFormatados;
    },
    enabled: !!empresaId,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
