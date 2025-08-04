
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface Mensagem {
  id: number;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  created_at: string;
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
    staleTime: 0, // Sempre refetch para ter dados em tempo real
    refetchOnWindowFocus: true,
  });

  // Configurar realtime para mensagens
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
          queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
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
          queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando realtime para conversa:', conversaId);
      supabase.removeChannel(channel);
    };
  }, [conversaId, queryClient]);

  const enviarMensagem = useMutation({
    mutationFn: async ({ conteudo }: { conteudo: string }) => {
      if (!conversaId || !user?.id) {
        throw new Error('Dados insuficientes para enviar mensagem');
      }

      console.log('📤 Enviando mensagem:', { conversaId, conteudo: conteudo.substring(0, 50) + '...' });

      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          remetente_id: user.id,
          conteudo: conteudo.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem enviada:', data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
    },
    onError: (error) => {
      console.error('❌ Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  });

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', conversaId] });
    }
  });

  return {
    mensagens,
    isLoading,
    error,
    enviarMensagem,
    marcarComoLida
  };
};
