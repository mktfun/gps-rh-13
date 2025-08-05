
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDeletarConversa = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (conversaId: string) => {
      console.log('🗑️ Deletando conversa:', conversaId);
      
      const { error } = await supabase.rpc('deletar_conversa', { 
        p_conversa_id: conversaId 
      });
      
      if (error) {
        console.error('❌ Erro ao deletar conversa:', error);
        throw error;
      }
      
      console.log('✅ Conversa deletada com sucesso');
    },
    onSuccess: () => {
      toast.success('Conversa excluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      queryClient.invalidateQueries({ queryKey: ['conversas-widget'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na exclusão:', error);
      toast.error(error.message || 'Erro ao excluir conversa');
    },
  });
};
