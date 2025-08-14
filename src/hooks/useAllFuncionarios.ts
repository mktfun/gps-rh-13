
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Funcionario {
  id: string;
  nome: string;
  cpf: string;
  status: string;
}

export const useAllFuncionarios = () => {
  return useQuery({
    queryKey: ['all-funcionarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, cpf, status')
        .eq('status', 'ativo')
        .order('nome');

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        throw error;
      }

      return data as Funcionario[];
    },
  });
};
