
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

// PROTOCOLO GAMBIARRA CONTROLADA: Interface para RPC customizada não presente nos tipos gerados
interface RelatorioFuncionarioEmpresa {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  status: string;
  cnpj_razao_social: string;
  data_contratacao: string;
}

interface UseRelatorioFuncionariosEmpresaParams {
  cnpjId?: string;
}

export const useRelatorioFuncionariosEmpresa = (params: UseRelatorioFuncionariosEmpresaParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { cnpjId } = params;

  return useQuery({
    queryKey: ['relatorio-funcionarios-empresa', empresaId, cnpjId],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('Buscando relatório de funcionários da empresa:', { empresaId, cnpjId });

      // PROTOCOLO GAMBIARRA CONTROLADA: RPC customizada não presente nos tipos gerados
      const { data, error } = await (supabase as any).rpc('get_relatorio_funcionarios_empresa', {
        p_empresa_id: empresaId,
        p_cnpj_id: cnpjId || null
      });

      if (error) {
        console.error('Erro ao buscar relatório de funcionários da empresa:', error);
        throw error;
      }

      console.log('✅ Relatório de funcionários carregado:', data);
      return (data || []) as RelatorioFuncionarioEmpresa[];
    },
    enabled: !!empresaId,
  });
};
