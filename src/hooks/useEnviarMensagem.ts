

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface MensagemOtimista {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
  status: 'enviando' | 'enviado' | 'erro';
}

export const useEnviarMensagem = (conversaId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conteudo }: { conteudo: string }) => {
      if (!conversaId || !user?.id) {
        throw new Error('Dados insuficientes para enviar mensagem');
      }

      console.log('📤 Enviando mensagem:', { conversaId, conteudo: conteudo.substring(0, 50) + '...' });

      const { data, error } = await supabase
        .from('mensagens')
        .insert({
          conversa_id: conversaId,
          remetente_id: user.id,
          conteudo: conteudo.trim()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      console.log('✅ Mensagem enviada:', data);
      return data;
    },
    onMutate: async ({ conteudo }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['mensagens', conversaId] });

      // Snapshot do estado anterior
      const previousMensagens = queryClient.getQueryData(['mensagens', conversaId]);

      // Criar mensagem otimista
      const mensagemOtimista: MensagemOtimista = {
        id: `temp-${Date.now()}`, // ID temporário
        conversa_id: conversaId,
        remetente_id: user!.id,
        conteudo: conteudo.trim(),
        lida: false,
        lida_em: null,
        created_at: new Date().toISOString(),
        status: 'enviando'
      };

      // Atualizar cache otimisticamente
      queryClient.setQueryData(['mensagens', conversaId], (old: any[]) => {
        return [...(old || []), mensagemOtimista];
      });

      console.log('⚡ Mensagem otimista adicionada:', mensagemOtimista);

      return { previousMensagens, mensagemOtimista };
    },
    onSuccess: (data, variables, context) => {
      // Substituir mensagem otimista pela real
      queryClient.setQueryData(['mensagens', conversaId], (old: any[]) => {
        if (!old) return [data];
        
        return old.map(msg => 
          msg.id === context?.mensagemOtimista.id 
            ? { ...data, status: 'enviado' }
            : msg
        );
      });

      console.log('✅ Mensagem otimista atualizada com dados reais');
    },
    onError: (error, variables, context) => {
      console.error('❌ Erro ao enviar mensagem:', error);
      
      // Reverter para estado anterior
      if (context?.previousMensagens) {
        queryClient.setQueryData(['mensagens', conversaId], context.previousMensagens);
      }
      
      // Mostrar erro discreto (não toast que sobrepõe UI)
      console.error('Falha ao enviar mensagem:', error.message);
    },
    retry: 2, // Tentar novamente 2 vezes
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};

