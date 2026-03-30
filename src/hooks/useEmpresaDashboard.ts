
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface EmpresaDashboardData {
  solicitacoes_pendentes_count: number;
  funcionarios_travados_count: number;
}

export const useEmpresaDashboard = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard-basic', empresaId],
    queryFn: async (): Promise<EmpresaDashboardData> => {
      logger.info('🔍 [useEmpresaDashboard] Carregando dados básicos...');

      if (!empresaId) {
        logger.error('❌ Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      // Por enquanto, vamos retornar dados mockados até termos uma função específica
      // Este hook deve ser usado apenas para dados que não estão na função principal
      return {
        solicitacoes_pendentes_count: 0,
        funcionarios_travados_count: 0,
      };
    },
    enabled: !!empresaId,
    retry: 1,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
