
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmpresaActionsNeeded {
  solicitacoes_pendentes_count: number;
  funcionarios_travados_count: number;
}

export const useEmpresaActionsNeeded = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-actions-needed', user?.id],
    queryFn: async (): Promise<EmpresaActionsNeeded> => {
      console.log('🔍 Buscando ações necessárias da empresa...');

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

      console.log('✅ Métricas de ações necessárias carregadas:', data);

      // Safe type assertion using unknown first
      const typedData = data as unknown as EmpresaActionsNeeded;

      return {
        solicitacoes_pendentes_count: typedData.solicitacoes_pendentes_count || 0,
        funcionarios_travados_count: typedData.funcionarios_travados_count || 0,
      };
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: true, // Recarrega quando volta para a aba
  });
};
