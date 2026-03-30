
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface ConcluirPendenciaParams {
  pendenciaId: string;
}

export const useConcluirPendencia = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pendenciaId }: ConcluirPendenciaParams) => {
      logger.info(`🚀 Marcando pendência ${pendenciaId} como concluída`);
      
      const { data, error } = await supabase
        .from('pendencias')
        .update({ 
          status: 'resolvida',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendenciaId)
        .select()
        .single();

      if (error) {
        logger.error('❌ Erro ao concluir pendência:', error);
        throw error;
      }

      logger.info('✅ Pendência concluída com sucesso:', data);
      return data;
    },

    onSuccess: () => {
      logger.info('🎉 Pendência marcada como concluída!');
      
      // Invalidar queries relacionadas para atualizar a UI
      queryClient.invalidateQueries({ queryKey: ['pendencias-report'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: 'Sucesso',
        description: 'Pendência marcada como concluída com sucesso!',
      });
    },

    onError: (error) => {
      logger.error('❌ Erro ao concluir pendência:', error);
      
      toast({
        title: 'Erro',
        description: `Erro ao marcar pendência como concluída: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
