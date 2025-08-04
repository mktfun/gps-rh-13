
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Conversa {
  id: string;
  titulo?: string;
  corretora_id?: string;
  empresa_id?: string;
  created_at: string;
  empresas?: {
    id: string;
    nome: string;
  };
  profiles?: {
    id: string;
    nome?: string;
  };
}

interface Mensagem {
  id: string;
  conversa_id: string;
  autor_id: string;
  conteudo: string;
  tipo: 'texto' | 'arquivo';
  created_at: string;
  profiles?: {
    nome?: string;
  };
}

export const useConversas = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversas'],
    queryFn: async (): Promise<Conversa[]> => {
      if (!user) {
        console.log('Usuário não autenticado.');
        return [];
      }

      console.log('🔍 Buscando conversas do usuário:', user.id);

      const { data: conversas, error } = await supabase
        .from('conversas')
        .select(`
          *,
          empresas (
            id,
            nome
          )
        `)
        .or(`corretora_id.eq.${user.id},empresa_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      console.log('✅ Conversas encontradas:', conversas?.length || 0);
      return conversas || [];
    },
    enabled: !!user,
  });

  const createConversaCorretora = useMutation({
    mutationFn: async ({ empresaId }: { empresaId: string }) => {
      console.log('📝 Criando conversa entre corretora e empresa:', empresaId);

      if (!empresaId) {
        throw new Error('ID da empresa é obrigatório');
      }

      const { data, error } = await supabase.rpc('find_or_create_conversation_corretora', {
        p_empresa_id: empresaId
      });

      if (error) throw error;
      
      // Verificar se data tem as propriedades esperadas e fazer cast seguro
      if (data && typeof data === 'object') {
        const conversaData = data as any;
        if ('conversa' in conversaData && conversaData.conversa && 'id' in conversaData.conversa) {
          return conversaData.conversa as Conversa;
        }
      }
      
      throw new Error('Resposta inválida do servidor');
    },
    onSuccess: (data) => {
      console.log('✅ Conversa criada/encontrada:', data);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      
      // Adicionar ao cache se retornou dados válidos
      queryClient.setQueryData(['conversas'], (oldData: Conversa[] = []) => {
        const exists = oldData.find(c => c.id === data.id);
        if (!exists) {
          return [...oldData, data];
        }
        return oldData;
      });

      toast.success('Conversa iniciada com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Erro ao criar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    },
  });

  const getMensagens = async (conversaId: string): Promise<Mensagem[]> => {
    console.log(`🔍 Buscando mensagens da conversa: ${conversaId}`);

    const { data: mensagens, error } = await supabase
      .from('mensagens')
      .select(`
        id,
        conversa_id,
        remetente_id,
        conteudo,
        created_at
      `)
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar mensagens:', error);
      throw error;
    }

    console.log(`✅ Mensagens encontradas: ${mensagens?.length || 0}`);
    
    // Mapear para o formato esperado
    return (mensagens || []).map(msg => ({
      id: msg.id.toString(),
      conversa_id: msg.conversa_id,
      autor_id: msg.remetente_id,
      conteudo: msg.conteudo,
      tipo: 'texto' as const,
      created_at: msg.created_at,
      profiles: undefined
    }));
  };

  const useRealtimeMensagens = (conversaId: string) => {
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);

    useEffect(() => {
      if (!conversaId) return;

      const channel = supabase
        .channel(`conversa_${conversaId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`
        },
        (payload) => {
          console.log('Realtime payload:', payload);
          
          if (payload.new && typeof payload.new === 'object' && 'conversa_id' in payload.new && payload.new.conversa_id === conversaId) {
            const payloadData = payload.new as any;
            const novaMensagem: Mensagem = {
              id: payloadData.id.toString(),
              conversa_id: payloadData.conversa_id,
              autor_id: payloadData.remetente_id,
              conteudo: payloadData.conteudo,
              tipo: 'texto',
              created_at: payloadData.created_at,
              profiles: {
                nome: user?.user_metadata?.name as string | undefined
              }
            };
            setMensagens(prevMensagens => [...prevMensagens, novaMensagem]);
          } else {
            console.warn('Payload sem nova mensagem ou estrutura inesperada:', payload);
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [conversaId, user]);

    return mensagens;
  };

  return {
    conversas: data || [],
    isLoading,
    error,
    createConversaCorretora,
    getMensagens,
    useRealtimeMensagens
  };
};
