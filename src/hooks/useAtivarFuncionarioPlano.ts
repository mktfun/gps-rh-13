import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAtivarFuncionarioPlano = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ funcionarioId, planoId }: { funcionarioId: string; planoId: string }) => {
      const { data, error } = await supabase.rpc('ativar_funcionario_no_plano', {
        p_funcionario_id: funcionarioId,
        p_plano_id: planoId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success('Funcionário ativado com sucesso!');
      // Invalida as queries para forçar a atualização da lista e dos KPIs
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', variables.planoId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', variables.planoId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao ativar funcionário.');
    },
  });
};
