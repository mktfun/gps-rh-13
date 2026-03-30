
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface PlanoFaixaPreco {
  id: string;
  faixa_inicio: number;
  faixa_fim: number;
  valor: number;
}

export const usePlanoSaudeFaixas = (planoId: string | null) => {
  return useQuery({
    queryKey: ['plano-faixas-preco', planoId],
    queryFn: async (): Promise<PlanoFaixaPreco[]> => {
      if (!planoId) return [];

      logger.info('🔍 Buscando faixas de preço para plano:', planoId);

      const { data, error } = await supabase
        .from('planos_faixas_de_preco')
        .select('*')
        .eq('plano_id', planoId)
        .order('faixa_inicio', { ascending: true });

      if (error) {
        logger.error('❌ Erro ao buscar faixas de preço:', error);
        throw error;
      }

      logger.info('✅ Faixas de preço encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!planoId,
  });
};
