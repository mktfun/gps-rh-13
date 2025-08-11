
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type EstadoCivil = Database['public']['Enums']['estado_civil'];

interface CreateFuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  estado_civil: EstadoCivil;
  email?: string;
  cnpj_id: string;
}

export const useCreateFuncionario = () => {
  const queryClient = useQueryClient();

  const createFuncionario = useMutation({
    mutationFn: async (data: CreateFuncionarioData) => {
      console.log('🔄 Criando funcionário:', data);

      // Calcular idade baseada na data de nascimento
      const idade = data.data_nascimento 
        ? new Date().getFullYear() - new Date(data.data_nascimento).getFullYear()
        : 0;

      const funcionarioData = {
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        cargo: data.cargo,
        salario: data.salario,
        estado_civil: data.estado_civil,
        email: data.email,
        cnpj_id: data.cnpj_id,
        idade,
        status: 'pendente' as const,
      };

      console.log('📋 Dados formatados para inserção:', funcionarioData);

      const { data: result, error } = await supabase
        .from('funcionarios')
        .insert(funcionarioData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário criado com sucesso:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Funcionário criado! Invalidando cache...');
      
      // Invalidar todas as queries relacionadas aos funcionários
      queryClient.invalidateQueries({ 
        queryKey: ['funcionarios'] 
      });

      // Invalidar queries de empresa
      queryClient.invalidateQueries({ 
        queryKey: ['funcionarios-empresa-completo'] 
      });

      toast.success(`Funcionário ${data.nome} adicionado com sucesso!`);
    },
    onError: (error: any) => {
      console.error('💥 Erro ao criar funcionário:', error);
      toast.error(error?.message || 'Erro ao adicionar funcionário');
    },
  });

  return {
    createFuncionario,
    isCreating: createFuncionario.isPending,
  };
};
