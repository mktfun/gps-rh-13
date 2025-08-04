
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FuncionarioDetalhes {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  idade: number;
  estado_civil: string;
  salario: number;
  email?: string;
  status: string;
  created_at: string;
  cnpj_id: string;
  cnpj: {
    id: string;
    cnpj: string;
    razao_social: string;
    empresa: {
      id: string;
      nome: string;
    };
  };
}

interface PlanoDisponivel {
  id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
}

export const useAtivarFuncionario = (funcionarioId: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['ativar-funcionario', funcionarioId],
    queryFn: async () => {
      // Buscar dados do funcionário
      const { data: funcionarioData, error: funcionarioError } = await supabase
        .from('funcionarios')
        .select(`
          *,
          cnpj:cnpjs!inner(
            id,
            cnpj,
            razao_social,
            empresa:empresas!inner(
              id,
              nome
            )
          )
        `)
        .eq('id', funcionarioId)
        .single();

      if (funcionarioError) throw funcionarioError;

      // Buscar planos disponíveis para o CNPJ
      const { data: planosData, error: planosError } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('cnpj_id', funcionarioData.cnpj_id);

      if (planosError) throw planosError;

      return {
        funcionario: funcionarioData as FuncionarioDetalhes,
        planos: planosData as PlanoDisponivel[]
      };
    },
    enabled: !!funcionarioId
  });

  return {
    funcionario: data?.funcionario,
    planos: data?.planos || [],
    isLoading,
    error
  };
};
