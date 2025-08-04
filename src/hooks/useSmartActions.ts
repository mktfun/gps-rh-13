
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SmartActionsData {
  aprovacoes_rapidas: number;
  ativacoes_pendentes: number;
  cnpjs_sem_plano: number;
  funcionarios_travados: number;
}

export const useSmartActions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['smart-actions', user?.id],
    queryFn: async (): Promise<SmartActionsData> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_smart_actions_corretor');

      if (error) {
        console.error('Erro ao buscar smart actions:', error);
        throw error;
      }

      // Safe type casting with validation
      const typedData = data as unknown as SmartActionsData;

      return {
        aprovacoes_rapidas: Number(typedData.aprovacoes_rapidas) || 0,
        ativacoes_pendentes: Number(typedData.ativacoes_pendentes) || 0,
        cnpjs_sem_plano: Number(typedData.cnpjs_sem_plano) || 0,
        funcionarios_travados: Number(typedData.funcionarios_travados) || 0,
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Auto-refresh a cada 30 segundos
    staleTime: 20000,
  });
};
