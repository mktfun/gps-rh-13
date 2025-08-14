import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

export interface PulseFinanceiroData {
  receita_mes: number;
  crescimento_percentual: number;
  comissao_estimada: number;
  margem_risco: number;
  oportunidades: number;
}

export const usePulseFinanceiro = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['pulse-financeiro', user?.id],
    queryFn: async (): Promise<PulseFinanceiroData> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Try the safe function first, fallback to original if not available
      let { data, error } = await supabase.rpc('get_pulse_financeiro_corretor_safe');

      // If safe function doesn't exist, try the original
      if (error && error.code === '42883') {
        console.log('Safe function not found, trying original...');
        ({ data, error } = await supabase.rpc('get_pulse_financeiro_corretor'));
      }

      if (error) {
        console.error('Erro ao buscar pulse financeiro:', error);
        throw error;
      }

      // Safe type casting with validation and fallback to 0 for invalid values
      const typedData = data as unknown as PulseFinanceiroData;

      return {
        receita_mes: isNaN(Number(typedData.receita_mes)) ? 0 : Number(typedData.receita_mes),
        crescimento_percentual: isNaN(Number(typedData.crescimento_percentual)) ? 0 : Number(typedData.crescimento_percentual),
        comissao_estimada: isNaN(Number(typedData.comissao_estimada)) ? 0 : Number(typedData.comissao_estimada),
        margem_risco: isNaN(Number(typedData.margem_risco)) ? 0 : Number(typedData.margem_risco),
        oportunidades: isNaN(Number(typedData.oportunidades)) ? 0 : Number(typedData.oportunidades),
      };
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Auto-refresh a cada 30 segundos
    staleTime: 20000, // Considera dados válidos por 20 segundos
  });
};
