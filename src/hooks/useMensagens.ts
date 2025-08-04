

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

interface Mensagem {
  id: number;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
  status?: 'enviando' | 'enviado' | 'erro';
}

export const useMensagens = (conversaId: string | null) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

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
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });

  // Configurar realtime e presence
  useEffect(() => {
    if (!conversaId || !user?.id) return;

    console.log('🔄 Configurando realtime e presence para conversa:', conversaId);

    const channel = supabase.channel(`conversa-${conversaId}`);

    // Configurar presence
    channel.on('presence', { event: 'sync' }, () => {
      console.log('👥 Sync presence state');
      const userIds: string[] = [];
      const state = channel.presenceState();
      
      for (const userId in state) {
        // @ts-ignore
        const presences = state[userId];
        if (presences && presences.length > 0) {
          userIds.push(userId);
        }
      }
      
      console.log('👥 Usuários online:', userIds);
      setOnlineUsers(userIds);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('👋 Usuário entrou:', key, newPresences);
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('👋 Usuário saiu:', key, leftPresences);
    });

    // Configurar postgres changes
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens',
        filter: `conversa_id=eq.${conversaId}`
      },
      (payload) => {
        console.log('📨 Nova mensagem em tempo real:', payload);
        
        queryClient.setQueryData(['mensagens', conversaId], (old: Mensagem[]) => {
          const novaMensagem = payload.new as Mensagem;
          const exists = old?.some(msg => msg.id === novaMensagem.id);
          
          if (!exists) {
            return [...(old || []), novaMensagem];
          }
          return old;
        });

        if (payload.new.remetente_id !== user?.id) {
          marcarComoLidas.mutate();
        }
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mensagens',
        filter: `conversa_id=eq.${conversaId}`
      },
      (payload) => {
        console.log('📝 Mensagem atualizada em tempo real:', payload);
        
        queryClient.setQueryData(['mensagens', conversaId], (old: Mensagem[]) => {
          return old?.map(msg => 
            msg.id === payload.new.id 
              ? { ...msg, ...payload.new }
              : msg
          ) || [];
        });
      }
    );

    // Subscribe e track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Canal subscrito, enviando presence...');
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString()
        });
      }
    });

    return () => {
      console.log('🔌 Desconectando realtime e presence para conversa:', conversaId);
      supabase.removeChannel(channel);
      setOnlineUsers([]);
    };
  }, [conversaId, queryClient, user?.id]);

  const marcarComoLidas = useMutation({
    mutationFn: async () => {
      if (!conversaId) return;
      
      console.log('👁️ Marcando mensagens como lidas para conversa:', conversaId);

      const { error } = await supabase.rpc('marcar_mensagens_como_lidas', {
        p_conversa_id: conversaId
      });

      if (error) {
        console.error('❌ Erro ao marcar mensagens como lidas:', error);
        throw error;
      }

      console.log('✅ Mensagens marcadas como lidas');
    }
  });

  return {
    mensagens,
    isLoading,
    error,
    marcarComoLidas,
    onlineUsers
  };
};

