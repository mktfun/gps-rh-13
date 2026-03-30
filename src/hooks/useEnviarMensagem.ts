
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface MensagemOtimista {
  id: string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  lida: boolean;
  lida_em: string | null;
  created_at: string;
  status: 'enviando' | 'enviado' | 'erro';
  tipo?: string;
  metadata?: any;
}

interface EnviarMensagemParams {
  conteudo: string;
  tipo?: string;
  metadata?: any;
}

export const useEnviarMensagem = (conversaId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ conteudo, tipo = 'texto', metadata }: EnviarMensagemParams) => {
      if (!conversaId || !user?.id) {
        throw new Error('Dados insuficientes para enviar mensagem');
      }

      // Validar e sanitizar o conteúdo
      const conteudoLimpo = conteudo?.trim() || '';
      
      if (!conteudoLimpo) {
        throw new Error('Conteúdo da mensagem não pode estar vazio');
      }

      if (conteudoLimpo.length > 5000) {
        throw new Error('Conteúdo da mensagem muito longo (máximo 5000 caracteres)');
      }

      logger.info('📤 Enviando mensagem:', { conversaId, tipo, conteudo: conteudoLimpo.substring(0, 50) + '...' });

      const mensagemData: any = {
        conversa_id: conversaId,
        remetente_id: user.id,
        conteudo: conteudoLimpo,
        tipo: tipo || 'texto'
      };

      if (metadata) {
        mensagemData.metadata = metadata;
      }

      const { data, error } = await supabase
        .from('mensagens')
        .insert(mensagemData)
        .select()
        .single();

      if (error) {
        logger.error('❌ Erro ao enviar mensagem:', error);
        throw error;
      }

      logger.info('✅ Mensagem enviada:', data);
      return data;
    },
    onMutate: async ({ conteudo, tipo = 'texto', metadata }) => {
      // Cancelar queries em andamento
      await queryClient.cancelQueries({ queryKey: ['mensagens', conversaId] });

      // Snapshot do estado anterior
      const previousMensagens = queryClient.getQueryData(['mensagens', conversaId]);

      // Validar conteúdo antes de criar mensagem otimista
      const conteudoLimpo = conteudo?.trim() || '';
      
      if (!conteudoLimpo) {
        throw new Error('Conteúdo da mensagem não pode estar vazio');
      }

      // Criar mensagem otimista
      const mensagemOtimista: MensagemOtimista = {
        id: `temp-${Date.now()}`, // ID temporário
        conversa_id: conversaId,
        remetente_id: user!.id,
        conteudo: conteudoLimpo,
        lida: false,
        lida_em: null,
        created_at: new Date().toISOString(),
        status: 'enviando',
        tipo: tipo || 'texto',
        metadata
      };

      // Atualizar cache otimisticamente
      queryClient.setQueryData(['mensagens', conversaId], (old: any[]) => {
        return [...(old || []), mensagemOtimista];
      });

      logger.info('⚡ Mensagem otimista adicionada:', mensagemOtimista);

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

      logger.info('✅ Mensagem otimista atualizada com dados reais');
    },
    onError: (error, variables, context) => {
      logger.error('❌ Erro ao enviar mensagem:', error);
      
      // Reverter para estado anterior
      if (context?.previousMensagens) {
        queryClient.setQueryData(['mensagens', conversaId], context.previousMensagens);
      }
      
      // Mostrar erro discreto (não toast que sobrepõe UI)
      logger.error('Falha ao enviar mensagem:', error.message);
    },
    retry: 2, // Tentar novamente 2 vezes
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
};
