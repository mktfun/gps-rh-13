
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
          id,
          corretora_id,
          empresa_id,
          created_at,
          empresa:empresas(id, nome),
          corretora:profiles!conversas_corretora_id_fkey(id, nome)
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
      return data || [];
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

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar conversa');
      }

      console.log('✅ Conversa criada/encontrada:', data.conversa);
      return data.conversa;
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

      if (!data.success) {
        throw new Error(data.error || 'Erro ao criar conversa');
      }

      console.log('✅ Conversa criada/encontrada:', data.conversa);
      return data.conversa;
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
