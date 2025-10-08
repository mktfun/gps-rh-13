import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoDisponivel {
  id: string;
  tipo_seguro: 'vida' | 'saude';
  seguradora: string;
}

export const usePlanosDisponiveis = (cnpjId: string | null) => {
  return useQuery({
    queryKey: ['planos-disponiveis', cnpjId],
    queryFn: async () => {
      if (!cnpjId) return [];

      const { data, error } = await supabase
        .from('dados_planos')
        .select('id, tipo_seguro, seguradora')
        .eq('cnpj_id', cnpjId);

      if (error) {
        console.error('❌ Erro ao buscar planos disponíveis:', error);
        throw error;
      }

      return (data || []) as PlanoDisponivel[];
    },
    enabled: !!cnpjId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};
