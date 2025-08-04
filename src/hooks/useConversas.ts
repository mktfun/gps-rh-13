
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Conversa {
  id: string;
  corretora_id: string;
  empresa_id: string;
  created_at: string;
  // Dados relacionados
  empresa?: {
    id: string;
    nome: string;
  };
  corretora?: {
    id: string;
    nome: string;
  };
}

// Tipos para as respostas das RPCs
type RpcConversaCorretora = {
  success: boolean;
  conversa?: {
    id: string;
    empresa_id: string;
    empresa_nome: string;
    created_at: string;
  };
  error?: string;
};

type RpcConversaEmpresa = {
  success: boolean;
  conversa?: {
    id: string;
    corretora_id: string;
    corretora_nome: string;
    created_at: string;
  };
  error?: string;
};

export const useConversas = () => {
  const { user, role, empresaId } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: conversas = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['conversas', user?.id, role],
    queryFn: async (): Promise<Conversa[]> => {
      console.log('🔍 Buscando conversas para:', { userId: user?.id, role });

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      // Buscar conversas básicas primeiro
      let conversasQuery = supabase
        .from('conversas')
        .select('*')
        .order('created_at', { ascending: false });

      // Filtrar baseado no role
      if (role === 'corretora') {
        conversasQuery = conversasQuery.eq('corretora_id', user.id);
      } else if (role === 'empresa' && empresaId) {
        conversasQuery = conversasQuery.eq('empresa_id', empresaId);
      } else {
        // Se não for corretora nem empresa com empresaId, retornar vazio
        return [];
      }

      const { data: conversasData, error: conversasError } = await conversasQuery;

      if (conversasError) {
        console.error('❌ Erro ao buscar conversas:', conversasError);
        throw conversasError;
      }

      if (!conversasData || conversasData.length === 0) {
        console.log('✅ Nenhuma conversa encontrada');
        return [];
      }

      // Buscar dados das empresas
      const empresaIds = [...new Set(conversasData.map(c => c.empresa_id))];
      const { data: empresasData } = await supabase
        .from('empresas')
        .select('id, nome')
        .in('id', empresaIds);

      // Buscar dados dos profiles (corretoras)
      const corretoraIds = [...new Set(conversasData.map(c => c.corretora_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', corretoraIds);

      // Combinar os dados
      const conversasCompletas = conversasData.map(conversa => ({
        id: conversa.id,
        corretora_id: conversa.corretora_id,
        empresa_id: conversa.empresa_id,
        created_at: conversa.created_at,
        empresa: empresasData?.find(e => e.id === conversa.empresa_id) || undefined,
        corretora: profilesData?.find(p => p.id === conversa.corretora_id) || undefined
      }));

      console.log('✅ Conversas encontradas:', conversasCompletas);
      return conversasCompletas;
    },
    enabled: !!user?.id && !!role,
    staleTime: 5 * 60 * 1000, // Cache agressivo de 5 minutos
    refetchOnWindowFocus: false, // Não refetch ao focar janela
  });

  // Configurar realtime para invalidações pontuais
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔄 Configurando realtime para conversas');

    const channel = supabase
      .channel(`conversas-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversas'
        },
        (payload) => {
          console.log('📨 Conversa alterada em tempo real:', payload);
          // Invalidar apenas se a conversa pertence ao usuário atual
          const conversa = payload.new || payload.old;
          if (conversa && (conversa.corretora_id === user.id || 
              (role === 'empresa' && conversa.empresa_id === empresaId))) {
            queryClient.invalidateQueries({ queryKey: ['conversas', user.id, role] });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Desconectando realtime para conversas');
      supabase.removeChannel(channel);
    };
  }, [user?.id, role, empresaId, queryClient]);

  // Mutação para corretoras criarem conversas
  const criarConversaCorretora = useMutation({
    mutationFn: async ({ empresaId }: { empresaId: string }) => {
      console.log('📝 Criando conversa entre corretora e empresa:', empresaId);

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      const { data, error } = await supabase.rpc('find_or_create_conversation_corretora', {
        p_empresa_id: empresaId
      });

      if (error) {
        console.error('❌ Erro ao criar conversa:', error);
        throw error;
      }

      const result = data as RpcConversaCorretora;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conversa');
      }

      console.log('✅ Conversa criada/encontrada:', result.conversa);
      return result.conversa!;
    },
    onSuccess: (conversa) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast.success(`Conversa com ${conversa.empresa_nome} iniciada`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao criar conversa:', error);
      toast.error(error.message || 'Erro ao iniciar conversa');
    }
  });

  // Mutação para empresas criarem conversas
  const criarConversaEmpresa = useMutation({
    mutationFn: async () => {
      console.log('📝 Criando conversa entre empresa e sua corretora');

      const { data, error } = await supabase.rpc('find_or_create_conversation_empresa');

      if (error) {
        console.error('❌ Erro ao criar conversa:', error);
        throw error;
      }

      const result = data as RpcConversaEmpresa;

      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conversa');
      }

      console.log('✅ Conversa criada/encontrada:', result.conversa);
      return result.conversa!;
    },
    onSuccess: (conversa) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast.success(`Conversa com ${conversa.corretora_nome} iniciada`);
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao criar conversa:', error);
      toast.error(error.message || 'Erro ao iniciar conversa');
    }
  });

  return {
    conversas,
    isLoading,
    error,
    criarConversaCorretora,
    criarConversaEmpresa
  };
};
