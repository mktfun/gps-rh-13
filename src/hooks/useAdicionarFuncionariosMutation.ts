
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosPayload {
  planoId: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, funcionarioIds }: AdicionarFuncionariosPayload) => {
      if (!planoId || !funcionarioIds.length) {
        throw new Error('Plano ID e funcionários são obrigatórios');
      }

      // Criar registros para inserção em massa
      const registros = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status: 'pendente' as const
      }));

      const { data, error } = await supabase
        .from('planos_funcionarios')
        .insert(registros)
        .select();

      if (error) {
        console.error('Erro ao adicionar funcionários ao plano:', error);
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ 
        queryKey: ['funcionarios-fora-do-plano', variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['plano-funcionarios', variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionariosStats'] 
      });

      toast.success(`${data.length} funcionário(s) adicionado(s) ao plano com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};
