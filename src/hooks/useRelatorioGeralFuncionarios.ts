
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FuncionarioRelatorio {
  funcionario_id: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  funcionario_cargo: string;
  funcionario_salario: number;
  funcionario_status: string;
  funcionario_data_contratacao: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
}

interface UseRelatorioGeralFuncionariosParams {
  empresaId?: string;
  status?: string;
  enabled?: boolean;
}

export const useRelatorioGeralFuncionarios = (params: UseRelatorioGeralFuncionariosParams = {}) => {
  const { user } = useAuth();
  const { empresaId, status, enabled = true } = params;

  return useQuery({
    queryKey: ['relatorio-geral-funcionarios', user?.id, empresaId, status],
    queryFn: async (): Promise<FuncionarioRelatorio[]> => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      // Targeted type assertion for custom RPC function not in generated types
      const { data, error } = await (supabase as any).rpc('get_relatorio_geral_funcionarios', {
        p_corretora_id: user.id,
        p_empresa_id: empresaId || null,
        p_status: status || null
      });

      if (error) {
        console.error('Erro ao buscar relatório geral de funcionários:', error);
        throw error;
      }

      // Verificação manual da estrutura dos dados para debug
      if (data && data.length > 0) {
        console.log('ESTRUTURA DO RELATÓRIO:', data[0]);
      }

      // Type assertion for the return data from our custom RPC function
      return (data as FuncionarioRelatorio[]) || [];
    },
    enabled: !!user?.id && enabled
  });
};
