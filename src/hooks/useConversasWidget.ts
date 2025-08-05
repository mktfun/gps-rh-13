
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

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
        console.log('Usuário não autenticado.');
        return [];
      }

      console.log('🔍 Buscando conversas do usuário:', user.id);

      const { data: conversas, error } = await supabase.rpc('get_conversas_usuario');

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      console.log('✅ Conversas encontradas:', conversas?.length || 0);
      console.log('📋 Dados das conversas:', conversas);
      
      // Mapear para o formato esperado
      return (conversas || []).map((conversa: any) => ({
        conversa_id: conversa.conversa_id,
        empresa_nome: conversa.empresa_nome,
        created_at: conversa.created_at,
        protocolo: conversa.protocolo || null,
        nao_lidas: conversa.nao_lidas || 0
      }));
    },
    enabled: !!user,
    refetchInterval: 3000, // Atualizar mais frequentemente para captuar novas mensagens
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
        console.log('⚡ Nova conversa em tempo real! Invalidando queries...', payload);

        // O JEITO ROBUSTO E SIMPLES
        // Invalida a query, forçando o React Query a buscar a lista completa e correta de novo.
        queryClient.invalidateQueries({ queryKey: ['conversas', user?.id] });
        queryClient.invalidateQueries({ queryKey: ['total-unread-count', user?.id] });
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensagens'
      }, (payload) => {
        console.log('⚡ Nova mensagem em tempo real! Invalidando queries...', payload);
        
        // Invalidar both queries para atualizar contadores
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
