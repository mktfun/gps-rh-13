
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface ConversaWidget {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
  protocolo?: string | null;
  nao_lidas: number; // Novo campo
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

  // Tempo real profissional - atualizações diretas no cache
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('public:conversas')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'conversas'
      }, (payload) => {
        console.log('⚡ Nova conversa em tempo real! Adicionando ao cache...', payload);

        // O JEITO PROFISSIONAL: ATUALIZE O CACHE DIRETAMENTE
        queryClient.setQueryData(['conversas', user?.id], (oldData: ConversaWidget[] | undefined) => {
          if (!oldData) return [payload.new];
          
          // Adiciona o novo item no topo da lista, sem duplicatas
          if (oldData.some(item => item.conversa_id === payload.new.id)) {
            return oldData;
          }
          
          // A RPC retorna 'conversa_id', o payload tem 'id'. Precisamos normalizar.
          const novaConversa: ConversaWidget = {
            conversa_id: payload.new.id,
            empresa_nome: payload.new.empresa_nome || 'Nova Conversa',
            created_at: payload.new.created_at,
            protocolo: payload.new.protocolo || null
          };
          
          return [novaConversa, ...oldData];
        });
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
