import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosPlanoData {
  plano_id: string;
  funcionarios_ids: string[];
}

export const useAdicionarFuncionariosPlano = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AdicionarFuncionariosPlanoData) => {
      console.log('Adicionando funcionários ao plano:', data);

      // Insert planos_funcionarios records (correct table name)
      const funcionariosPlanos = data.funcionarios_ids.map(funcionario_id => ({
        plano_id: data.plano_id,
        funcionario_id,
        status: 'pendente'
      }));

      const { error } = await supabase
        .from('planos_funcionarios')
        .insert(funcionariosPlanos);

      if (error) {
        console.error('Erro ao adicionar funcionários ao plano:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Funcionários adicionados ao plano com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-report'] });
    },
    onError: (error) => {
      console.error('Erro na mutação:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};
