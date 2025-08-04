
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface Mensagem {
  id: number;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
  status?: 'enviando' | 'enviado' | 'erro';
}

export const useMensagens = (conversaId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: mensagens = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['mensagens', conversaId],
    queryFn: async (): Promise<Mensagem[]> => {
      if (!conversaId) return [];

      console.log('🔍 Buscando mensagens para conversa:', conversaId);

      const { data, error } = await supabase
        .from('mensagens')
        .select('*')
        .eq('conversa_id', conversaId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw error;
      }

      console.log('✅ Mensagens encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!conversaId,
    staleTime: 30 * 1000, // Cache por 30 segundos
    refetchOnWindowFocus: false,
  });

  // Configurar realtime para atualizações diretas no cache
  useEffect(() => {
    if (!conversaId) return;

    console.log('🔄 Configurando realtime para conversa:', conversaId);

    const channel = supabase
      .channel(`mensagens-${conversaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`
        },
        (payload) => {
          console.log('📨 Nova mensagem em tempo real:', payload);
          
          // Atualizar cache diretamente sem invalidar
          queryClient.setQueryData(['mensagens', conversaId], (old: Mensagem[]) => {
            const novaMensagem = payload.new as Mensagem;
            const exists = old?.some(msg => msg.id === novaMensagem.id);
            
            if (!exists) {
              return [...(old || []), novaMensagem];
            }
            return old;
          });

          // Auto-marcar como lida se não for do usuário atual
          if (payload.new.remetente_id !== user?.id) {
            marcarComoLida.mutate({ mensagemId: payload.new.id });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`
        },
        (payload) => {
          console.log('📝 Mensagem atualizada em tempo real:', payload);
          
          // Atualizar mensagem específica no cache
          queryClient.setQueryData(['mensagens', conversaId], (old: Mensagem[]) => {
            return old?.map(msg => 
              msg.id === payload.new.id 
                ? { ...msg, ...payload.new }
                : msg
            ) || [];
          });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando realtime para conversa:', conversaId);
      supabase.removeChannel(channel);
    };
  }, [conversaId, queryClient, user?.id]);

  const marcarComoLida = useMutation({
    mutationFn: async ({ mensagemId }: { mensagemId: number }) => {
      console.log('👁️ Marcando mensagem como lida:', mensagemId);

      const { error } = await supabase
        .from('mensagens')
        .update({ lida: true })
        .eq('id', mensagemId)
        .neq('remetente_id', user?.id); // Só marca como lida se não for do próprio usuário

      if (error) {
        console.error('❌ Erro ao marcar como lida:', error);
        throw error;
      }

      console.log('✅ Mensagem marcada como lida');
    }
  });

  return {
    mensagens,
    isLoading,
    error,
    marcarComoLida
  };
};
