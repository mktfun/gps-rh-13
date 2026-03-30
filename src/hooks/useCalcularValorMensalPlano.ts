import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useCalcularValorMensalPlano = (planoId: string | undefined) => {
  return useQuery({
    queryKey: ['valor-mensal-plano', planoId],
    queryFn: async (): Promise<number> => {
      if (!planoId) {
        return 0;
      }

      logger.info('🔍 Calculando valor mensal baseado nas faixas etárias:', planoId);

      // Chamar RPC que calcula baseado nas faixas etárias cadastradas
      const { data, error } = await supabase
        .rpc('calcular_valor_mensal_plano_saude', { 
          p_plano_id: planoId 
        });

      if (error) {
        logger.error('❌ Erro ao calcular valor:', error);
        return 0;
      }

      logger.info('✅ Valor calculado:', data);
      return data || 0;
    },
    enabled: !!planoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
