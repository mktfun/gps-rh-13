
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FuncionarioForaDoPlano {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
}

export const useFuncionariosForaDoPlano = (planoId: string, cnpjId: string) => {
  return useQuery({
    queryKey: ['funcionarios-fora-do-plano', planoId, cnpjId],
    queryFn: async (): Promise<FuncionarioForaDoPlano[]> => {
      if (!planoId || !cnpjId) return [];

      // Primeiro, buscar os IDs dos funcionários que já estão no plano
      const { data: funcionariosNoPlano } = await supabase
        .from('planos_funcionarios')
        .select('funcionario_id')
        .eq('plano_id', planoId);

      const idsNoPlano = funcionariosNoPlano?.map(pf => pf.funcionario_id) || [];

      // Buscar funcionários do CNPJ que não estão no plano
      let query = supabase
        .from('funcionarios')
        .select('id, nome, cpf, cargo, salario, idade, status')
        .eq('cnpj_id', cnpjId)
        .eq('status', 'ativo');

      // Se há funcionários no plano, excluí-los da busca
      if (idsNoPlano.length > 0) {
        query = query.not('id', 'in', idsNoPlano);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Erro ao buscar funcionários fora do plano:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!planoId && !!cnpjId,
  });
};
