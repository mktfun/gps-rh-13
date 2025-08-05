
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useTotalUnreadCount = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['total-unread-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;

      console.log('🔢 Buscando total de mensagens não lidas...');

      const { data, error } = await supabase.rpc('contar_total_mensagens_nao_lidas');

      if (error) {
        console.error('❌ Erro ao contar mensagens não lidas:', error);
        return 0;
      }

      console.log('✅ Total de mensagens não lidas:', data);
      return data || 0;
    },
    enabled: !!user,
    refetchInterval: 5000, // Atualizar a cada 5 segundos
    staleTime: 0,
  });
};
