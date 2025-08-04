
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ConversaComProtocolo {
  id: string;
  protocolo: string | null;
  created_at: string;
  empresa_id: string | null;
  empresas?: {
    id: string;
    nome: string;
  };
}

export const useConversaComProtocolo = (conversaId: string | null) => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversa-protocolo', conversaId],
    queryFn: async (): Promise<ConversaComProtocolo | null> => {
      if (!conversaId || !user) {
        return null;
      }

      console.log('🔍 Buscando conversa com protocolo:', conversaId);

      const { data: conversa, error } = await supabase
        .from('conversas')
        .select(`
          *,
          empresas (
            id,
            nome
          )
        `)
        .eq('id', conversaId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar conversa:', error);
        throw error;
      }

      console.log('✅ Conversa encontrada:', conversa);
      return conversa;
    },
    enabled: !!conversaId && !!user,
  });

  return {
    conversa: data,
    isLoading,
    error
  };
};
