import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// TEMPORARIAMENTE DESABILITADO - Hook será reativado após atualização dos tipos do Supabase
// Execute: npx supabase gen types typescript --project-id gtufwxxjmnxnqcgsxjah > src/integrations/supabase/types.ts

export const useCalcularValorMensalPlano = (planoId: string | undefined) => {
  return useQuery({
    queryKey: ['valor-mensal-plano', planoId],
    queryFn: async (): Promise<number> => {
      if (!planoId) {
        return 0;
      }

      console.log('🔍 Calculando valor mensal para plano (MODO FALLBACK):', planoId);

      // FALLBACK: Buscar funcionários ativos e calcular estimativa
      const { data: planoData } = await supabase
        .from('dados_planos')
        .select('cnpj_id, tipo_seguro')
        .eq('id', planoId)
        .single();

      if (!planoData || planoData.tipo_seguro !== 'saude') {
        return 0;
      }

      const { data: funcionariosData } = await supabase
        .from('planos_funcionarios')
        .select('id', { count: 'exact' })
        .eq('plano_id', planoId)
        .eq('status', 'ativo');

      const totalFuncionariosNoPlano = funcionariosData?.length || 0;
      const valorEstimado = totalFuncionariosNoPlano * 200; // R$ 200 por funcionário NO PLANO

      console.log('✅ Valor estimado calculado:', valorEstimado, 'para', totalFuncionariosNoPlano, 'funcionários no plano');
      
      return valorEstimado;
    },
    enabled: !!planoId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
