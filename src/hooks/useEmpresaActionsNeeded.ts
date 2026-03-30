import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface EmpresaActionsNeeded {
  solicitacoes_pendentes_count: number;
  funcionarios_travados_count: number;
}

export const useEmpresaActionsNeeded = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-actions-needed', user?.id],
    queryFn: async (): Promise<EmpresaActionsNeeded> => {
      logger.info('🔍 [useEmpresaActionsNeeded] Buscando ações necessárias da empresa...');

      if (!user?.id) {
        logger.error('❌ [useEmpresaActionsNeeded] ID do usuário não encontrado');
        throw new Error('Usuário não autenticado');
      }

      // Primeiro buscar o perfil para obter o empresa_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.empresa_id) {
        logger.error('❌ [useEmpresaActionsNeeded] Erro ao buscar perfil ou empresa_id não encontrado');
        throw new Error('ID da empresa não encontrado');
      }

      // ✅ CORRETO - usando função com parâmetro UUID
      const { data, error } = await supabase.rpc('get_empresa_dashboard_metrics', {
        p_empresa_id: profile.empresa_id
      });

      if (error) {
        logger.error('❌ [useEmpresaActionsNeeded] Erro ao buscar métricas da empresa:', error);
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }

      if (!data) {
        logger.error('❌ [useEmpresaActionsNeeded] Nenhum dado retornado');
        throw new Error('Nenhum dado retornado');
      }

      logger.info('✅ [useEmpresaActionsNeeded] Métricas de ações necessárias carregadas:', data);

      // Type cast the data safely
      const typedData = data as unknown as { funcionarios_pendentes?: number };

      // Extrair dados de pendências dos dados do dashboard
      return {
        solicitacoes_pendentes_count: typedData.funcionarios_pendentes || 0,
        funcionarios_travados_count: 0, // Pode ser calculado baseado em status específicos
      };
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: true, // Recarrega quando volta para a aba
  });
};