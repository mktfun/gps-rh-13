
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
  const { user, role } = useAuth();
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
          created_at
        `)
        .order('created_at', { ascending: false });

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

  const criarConversa = useMutation({
    mutationFn: async ({ empresaId }: { empresaId: string }) => {
      console.log('📝 Criando conversa entre corretora e empresa:', empresaId);

      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('conversas')
        .insert({
          corretora_id: user.id,
          empresa_id: empresaId
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar conversa:', error);
        throw error;
      }

      console.log('✅ Conversa criada:', data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast.success('Conversa iniciada com sucesso');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    }
  });

  return {
    conversas,
    isLoading,
    error,
    criarConversa
  };
};
