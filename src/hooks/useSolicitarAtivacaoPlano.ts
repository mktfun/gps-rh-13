import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSolicitarAtivacaoPlano = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ funcionarioId, tipoPlano }: { funcionarioId: string; tipoPlano: 'saude' | 'vida' }) => {
      const { data, error } = await supabase.rpc('solicitar_ativacao_plano_existente', {
        p_funcionario_id: funcionarioId,
        p_tipo_plano: tipoPlano,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao solicitar ativação');
      }

      return result;
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Sucesso',
        description: 'Pendência de ativação criada com sucesso',
      });
      
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['funcionario-detalhes', variables.funcionarioId] });
      queryClient.invalidateQueries({ queryKey: ['vinculos-planos', variables.funcionarioId] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-empresa'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
};
