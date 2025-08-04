
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export type Notification = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
  entity_id?: string;
  link_url?: string;
};

export const useNotifications = (showAll: boolean = false) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar notificações com filtro opcional
  const {
    data: notifications = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['notifications', user?.id, showAll],
    queryFn: async () => {
      if (!user?.id) {
        console.log('Usuário não encontrado, retornando array vazio');
        return [];
      }

      console.log('🔍 Buscando notificações do Supabase para usuário:', user.id, 'showAll:', showAll);
      
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // AQUI ESTÁ O CONSERTO, PORRA! Filtrar por read = false se showAll for false
      if (!showAll) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar notificações:', error);
        throw error;
      }

      console.log('✅ Notificações encontradas no banco:', data);
      return (data || []) as Notification[];
    },
    enabled: !!user?.id,
  });

  // Mutation para marcar uma notificação específica como lida usando RPC
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      console.log('📝 Marcando notificação como lida via RPC:', notificationId);
      
      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('❌ Erro ao marcar notificação como lida:', error);
        throw error;
      }

      console.log('✅ Notificação marcada como lida com sucesso');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      console.log('🔄 Cache de notificações invalidado');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao marcar notificação como lida",
        variant: "destructive",
      });
      console.error('❌ Erro na mutation markAsRead:', error);
    }
  });

  // Mutation para marcar todas as notificações como lidas usando RPC
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log('📝 Marcando todas as notificações como lidas via RPC...');
      
      const { error } = await supabase.rpc('mark_all_notifications_as_read');

      if (error) {
        console.error('❌ Erro ao marcar todas as notificações como lidas:', error);
        throw error;
      }

      console.log('✅ Todas as notificações marcadas como lidas');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas",
      });
      console.log('🔄 Cache de notificações invalidado após marcar todas');
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Falha ao marcar todas as notificações como lidas",
        variant: "destructive",
      });
      console.error('❌ Erro na mutation markAllAsRead:', error);
    }
  });

  // Contadores úteis
  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    error,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};
