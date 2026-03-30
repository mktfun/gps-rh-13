
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AssuntoAtendimento {
  id: string;
  nome: string;
  mensagem_padrao: string;
  created_at: string;
}

export const useAssuntosAtendimento = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assuntos-atendimento'],
    queryFn: async (): Promise<AssuntoAtendimento[]> => {
      logger.info('🔍 Buscando assuntos de atendimento...');

      const { data: assuntos, error } = await supabase
        .from('assuntos_atendimento')
        .select('*')
        .order('nome');

      if (error) {
        logger.error('❌ Erro ao buscar assuntos:', error);
        throw error;
      }

      logger.info('✅ Assuntos encontrados:', assuntos?.length || 0);
      return assuntos || [];
    },
  });

  return {
    assuntos: data || [],
    isLoading,
    error
  };
};
