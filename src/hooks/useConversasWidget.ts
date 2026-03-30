
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

interface ConversaWidget {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
  protocolo?: string | null;
  nao_lidas: number;
}

export const useConversasWidget = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversas', user?.id],
    queryFn: async (): Promise<ConversaWidget[]> => {
      if (!user) {
        logger.info('Usuário não autenticado.');
        return [];
      }

      logger.info('🔍 Buscando conversas do usuário:', user.id);

      const { data: conversas, error } = await supabase.rpc('get_conversas_usuario');

      if (error) {
        logger.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      logger.info('✅ Conversas encontradas:', conversas?.length || 0);
      logger.info('📋 Dados das conversas:', conversas);
      
      // Mapear para o formato esperado
      return (conversas || []).map((conversa: any) => ({
        conversa_id: conversa.conversa_id,
        empresa_nome: conversa.empresa_nome,
        created_at: conversa.created_at,
        protocolo: conversa.protocolo || null,
        nao_lidas: Number(conversa.nao_lidas) || 0
      }));
    },
    enabled: !!user,
    refetchInterval: 3000, // Atualizar mais frequentemente para capturar novas mensagens
  });

  // Tempo real simplificado - invalidar queries ao invés de atualizar cache manualmente
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:conversas')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversas'
      }, (payload) => {
        logger.info('⚡ Nova conversa em tempo real! Invalidando queries...', payload);

        // Invalidar as queries para forçar refresh
        queryClient.invalidateQueries({ queryKey: ['conversas', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['total-unread-count', user?.id] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens'
      }, (payload) => {
        logger.info('⚡ Nova mensagem em tempo real! Invalidando queries...', payload);
        
        // Invalidar queries para atualizar contadores
        queryClient.invalidateQueries({ queryKey: ['conversas', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['total-unread-count', user?.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    conversas: data || [],
    isLoading,
    error
  };
};
