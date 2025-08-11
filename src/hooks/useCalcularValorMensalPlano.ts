
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useCalcularValorMensalPlano = (planoId: string | undefined) => {
  return useQuery({
    queryKey: ['valor-mensal-plano', planoId],
    queryFn: async (): Promise<number> => {
      if (!planoId) {
        return 0;
      }

      console.log('🔍 Calculando valor mensal para plano:', planoId);

      const { data, error } = await supabase.rpc('calcular_valor_mensal_plano_saude', {
        plano_uuid: planoId
      });

      if (error) {
        console.error('❌ Erro ao calcular valor mensal do plano:', error);
        throw error;
      }

      const valorCalculado = data || 0;
      console.log('✅ Valor mensal calculado:', valorCalculado);
      
      return valorCalculado;
    },
    enabled: !!planoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
