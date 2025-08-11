
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosData {
  planoId: string;
  funcionarioIds: string[];
  status?: 'ativo' | 'pendente';
}

export const useAdicionarFuncionariosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, funcionarioIds, status = 'pendente' }: AdicionarFuncionariosData) => {
      console.log('🔄 Adicionando funcionários ao plano:', { planoId, funcionarioIds, status });

      if (!planoId || !funcionarioIds.length) {
        throw new Error('Plano ID e lista de funcionários são obrigatórios');
      }

      // Preparar dados para inserção em massa
      const matriculas = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status
      }));

      const { data, error } = await supabase
        .from('planos_funcionarios')
        .insert(matriculas)
        .select();

      if (error) {
        console.error('❌ Erro ao adicionar funcionários ao plano:', error);
        throw error;
      }

      console.log('✅ Funcionários adicionados com sucesso:', data?.length || 0);
      return data;
    },
    onSuccess: (data, variables) => {
      const qtdAdicionados = data?.length || 0;
      toast.success(`${qtdAdicionados} funcionário(s) adicionado(s) ao plano com sucesso!`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['funcionarios-do-plano', variables.planoId] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano', variables.planoId] });
      queryClient.invalidateQueries({ queryKey: ['planos-da-empresa'] });
    },
    onError: (error: any) => {
      console.error('❌ Erro na mutação de adição:', error);
      toast.error(error?.message || 'Erro ao adicionar funcionários ao plano');
    },
  });
};
