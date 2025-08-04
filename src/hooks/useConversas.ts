import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

      let query = supabase
        .from('conversas')
        .select(`
          *,
          empresa:empresas ( id, nome ),
          corretora:profiles ( id, nome )
        `)
        .order('created_at', { ascending: false });

      // Filtrar baseado no role
      if (role === 'corretora') {
        query = query.eq('corretora_id', user.id);
      } else if (role === 'empresa' && empresaId) {
        query = query.eq('empresa_id', empresaId);
      } else {
        // Se não for corretora nem empresa com empresaId, retornar vazio
        return [];
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      console.log('✅ Conversas encontradas:', data);
      
      // Transformar os dados para o formato esperado
      return (data || []).map(item => ({
        id: item.id,
        corretora_id: item.corretora_id,
        empresa_id: item.empresa_id,
        created_at: item.created_at,
        empresa: item.empresa ? {
          id: item.empresa.id,
          nome: item.empresa.nome
        } : undefined,
        corretora: item.corretora ? {
          id: item.corretora.id,
          nome: item.corretora.nome
        } : undefined
      }));
    },
    enabled: !!user?.id && !!role,
    staleTime: 1 * 60 * 1000, // 1 minuto de cache
    refetchOnWindowFocus: true,
  });

  // Mutação para corretoras criarem conversas
  const criarConversaCorretora = useMutation({
    mutationFn: async ({ empresaId }: { empresaId: string }) => {
      console.log('📝 Criando conversa entre corretora e empresa:', empresaId);

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
