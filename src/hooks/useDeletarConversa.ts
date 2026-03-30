
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export const useDeletarConversa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversaId: string) => {
      logger.info('🗑️ Deletando conversa:', conversaId);
      
      const { error } = await supabase.rpc('deletar_conversa', { 
        p_conversa_id: conversaId 
      });
      
      if (error) {
        logger.error('❌ Erro ao deletar conversa:', error);
        throw error;
      }
      
      logger.info('✅ Conversa deletada com sucesso');
    },
    onSuccess: () => {
      toast.success('Conversa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['conversas-widget'] });
    },
    onError: (error: any) => {
      logger.error('❌ Erro na exclusão:', error);
      toast.error(error.message || 'Erro ao excluir conversa');
    },
  });
};
