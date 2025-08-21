import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmpresaActionsNeeded {
  solicitacoes_pendentes_count: number;
  funcionarios_travados_count: number;
}

export const useEmpresaActionsNeeded = () => {
  const { user, empresaId } = useAuth();
  const realEmpresaId = empresaId || user?.empresa_id;

  return useQuery({
    queryKey: ['empresa-actions-needed', realEmpresaId],
    queryFn: async (): Promise<EmpresaActionsNeeded> => {
      console.log('🔍 [useEmpresaActionsNeeded] Buscando ações necessárias da empresa...', realEmpresaId);

      if (!realEmpresaId) {
        console.error('❌ [useEmpresaActionsNeeded] ID da empresa não encontrado');
        throw new Error('ID da empresa é obrigatório');
      }

      // ✅ CORRETO - usando função com parâmetro UUID
      const { data, error } = await supabase.rpc('get_empresa_dashboard_metrics', {
        p_empresa_id: realEmpresaId
      });

      if (error) {
        console.error('❌ [useEmpresaActionsNeeded] Erro ao buscar métricas da empresa:', error);
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }

      if (!data) {
        console.error('❌ [useEmpresaActionsNeeded] Nenhum dado retornado');
        throw new Error('Nenhum dado retornado');
      }

      console.log('✅ [useEmpresaActionsNeeded] Métricas de ações necessárias carregadas:', data);

      // Extrair dados de pendências dos dados do dashboard
      return {
        solicitacoes_pendentes_count: data.funcionariosPendentes || 0,
        funcionarios_travados_count: 0, // Pode ser calculado baseado em status específicos
      };
    },
    enabled: !!realEmpresaId,
    retry: 1,
    staleTime: 2 * 60 * 1000, // 2 minutos de cache
    refetchOnWindowFocus: true, // Recarrega quando volta para a aba
  });
};
