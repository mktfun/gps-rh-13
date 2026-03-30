
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface EvolucaoMensal {
  mes: string;
  novos_funcionarios: number;
}

export const useEmpresaEvolucao = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-evolucao-mensal', user?.id],
    queryFn: async (): Promise<EvolucaoMensal[]> => {
      logger.info('🔍 Buscando evolução mensal da empresa...');

      if (!user?.id) {
        logger.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_empresa_evolucao_mensal');

      if (error) {
        logger.error('❌ Erro ao buscar evolução mensal:', error);
        throw new Error(`Erro ao buscar evolução mensal: ${error.message}`);
      }

      logger.info('✅ Evolução mensal carregada:', data);

      return data || [];
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
