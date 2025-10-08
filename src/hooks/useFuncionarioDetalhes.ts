import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FuncionarioDetalhado {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  data_nascimento: string;
  email: string | null;
  estado_civil: string | null;
  created_at: string;
  updated_at: string;
  data_admissao: string | null;
  cnpj_id: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
}

export const useFuncionarioDetalhes = (funcionarioId: string | null) => {
  return useQuery({
    queryKey: ['funcionario-detalhes', funcionarioId],
    queryFn: async (): Promise<FuncionarioDetalhado | null> => {
      if (!funcionarioId) return null;

      const { data, error } = await supabase.rpc('get_funcionario_by_id', {
        p_funcionario_id: funcionarioId,
      });

      if (error) throw error;
      
      // A RPC retorna um array, pegamos o primeiro item
      return data?.[0] || null;
    },
    enabled: !!funcionarioId,
  });
};
