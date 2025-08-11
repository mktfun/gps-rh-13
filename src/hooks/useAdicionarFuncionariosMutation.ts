
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosPayload {
  planoId: string;
  tipoSeguro: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, tipoSeguro, funcionarioIds }: AdicionarFuncionariosPayload) => {
      if (!planoId || !funcionarioIds.length || !tipoSeguro) {
        throw new Error('Plano ID, tipo de seguro e funcionários são obrigatórios');
      }

      console.log('🔄 Adicionando funcionários ao plano:', { planoId, tipoSeguro, funcionarioIds });

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
      console.log('✅ Funcionários adicionados com sucesso ao plano:', variables.planoId, 'tipo:', variables.tipoSeguro);
      
      // Invalidar queries específicas do plano e tipo
      queryClient.invalidateQueries({ 
        queryKey: ['funcionarios-fora-do-plano', variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionarios', variables.tipoSeguro, variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionariosStats', variables.tipoSeguro, variables.planoId] 
      });

      toast.success(`${data.length} funcionário(s) adicionado(s) ao plano com sucesso!`);
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};
