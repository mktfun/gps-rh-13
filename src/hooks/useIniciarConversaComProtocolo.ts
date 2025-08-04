
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const useIniciarConversaComProtocolo = () => {
  const { empresaId } = useAuth();
  const queryClient = useQueryClient();

  const iniciarConversa = useMutation({
    mutationFn: async ({ assuntoId }: { assuntoId: string }) => {
      console.log('📝 Iniciando conversa com protocolo:', { empresaId, assuntoId });

      if (!empresaId) {
        throw new Error('ID da empresa não encontrado');
      }

      const { data, error } = await supabase.rpc('iniciar_conversa_com_protocolo', {
        p_empresa_id: empresaId,
        p_assunto_id: assuntoId
      });

      if (error) {
        console.error('❌ Erro ao iniciar conversa:', error);
        throw error;
      }

      console.log('✅ Conversa criada com ID:', data);
      return data as string; // UUID da conversa criada
    },
    onSuccess: (conversaId) => {
      console.log('✅ Conversa iniciada com sucesso, ID:', conversaId);
      
      // Invalidar queries relacionadas para atualizar a lista
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      
      toast.success('Conversa iniciada com protocolo!');
    },
    onError: (error) => {
      console.error('❌ Erro ao iniciar conversa:', error);
      toast.error('Erro ao iniciar conversa');
    },
  });

  return iniciarConversa;
};
