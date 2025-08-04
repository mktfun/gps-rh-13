
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmpresaDashboardData {
  solicitacoes_pendentes_count: number;
  funcionarios_travados_count: number;
}

export const useEmpresaDashboard = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard', user?.id],
    queryFn: async (): Promise<EmpresaDashboardData> => {
      console.log('🔍 Carregando dados do dashboard da empresa...');

      if (!user?.id) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_empresa_dashboard_metrics');

      if (error) {
        console.error('❌ Erro ao buscar métricas da empresa:', error);
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado');
        throw new Error('Nenhum dado retornado');
      }

      console.log('✅ Dados do dashboard carregados:', data);

      // Safe type assertion using unknown first
      const typedData = data as unknown as EmpresaDashboardData;

      return {
        solicitacoes_pendentes_count: typedData.solicitacoes_pendentes_count || 0,
        funcionarios_travados_count: typedData.funcionarios_travados_count || 0,
      };
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: true,
  });
};
