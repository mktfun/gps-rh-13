
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DistribuicaoCargoData {
  cargo: string;
  count: number;
}

export const useEmpresaDistCargos = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dist-cargos', empresaId],
    queryFn: async (): Promise<DistribuicaoCargoData[]> => {
      console.log('🔍 [useEmpresaDistCargos] Buscando distribuição de cargos da empresa:', empresaId);

      if (!empresaId) {
        console.error('❌ [useEmpresaDistCargos] Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      // CORREÇÃO: Usar a função principal que já tem a lógica de distribuição de cargos
      const { data, error } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (error) {
        console.error('❌ [useEmpresaDistCargos] Erro ao buscar dados do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      console.log('📊 [useEmpresaDistCargos] Dashboard data raw:', data);

      // CORREÇÃO: Extrair os dados de distribuição de cargos da resposta principal
      const typedData = data as any;
      const distribuicaoCargos = typedData?.distribuicaoCargos || [];
      console.log('👥 [useEmpresaDistCargos] Distribuição de cargos extraída:', distribuicaoCargos);

      // CORREÇÃO: Garantir que os dados estão no formato correto
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
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
