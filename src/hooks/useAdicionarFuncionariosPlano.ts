
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

      // Insert funcionarios_planos records
      const funcionariosPlanos = data.funcionarios_ids.map(funcionario_id => ({
        plano_id: data.plano_id,
        funcionario_id,
        ativo: true
      }));

      const { error } = await supabase
        .from('funcionarios_planos')
        .insert(funcionariosPlanos);

      if (error) {
        console.error('Erro ao adicionar funcionários ao plano:', error);
        throw error;
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success('Funcionários adicionados ao plano com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['plano-funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano'] });
    },
    onError: (error) => {
      console.error('Erro na mutação:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};
