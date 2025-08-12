
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface RelatorioCustoEmpresaPaginado {
  cnpj_razao_social: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  valor_individual: number;
  status: string;
  total_cnpj: number;
  total_count: number;
  // Campos de totais globais retornados pela função SQL
  total_funcionarios_ativos: number;
  total_cnpjs_com_plano: number;
  total_geral: number;
  custo_medio_por_cnpj: number;
}

interface UseRelatorioCustosEmpresaPaginadoParams {
  pageSize?: number;
  pageIndex?: number;
}

export const useRelatorioCustosEmpresaPaginado = (params: UseRelatorioCustosEmpresaPaginadoParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { pageSize = 10, pageIndex = 0 } = params;

  return useQuery({
    queryKey: ['relatorio-custos-empresa-paginado', empresaId, pageSize, pageIndex],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Buscando relatório de custos paginado:', { 
        empresaId, 
        pageSize, 
        pageOffset: pageIndex * pageSize 
      });

      const { data, error } = await supabase.rpc('get_relatorio_custos_empresa', {
        p_empresa_id: empresaId,
        p_page_size: pageSize,
        p_page_offset: pageIndex * pageSize
      });

      if (error) {
        console.error('❌ Erro ao buscar relatório de custos paginado:', error);
        throw error;
      }

      console.log('✅ Relatório de custos paginado carregado:', data);
      
      const results = (data || []) as RelatorioCustoEmpresaPaginado[];
      const first = results[0];

      const totalCount = results.length > 0 ? Number(first?.total_count || 0) : 0;
      const totalPages = Math.ceil((totalCount || 0) / pageSize);

      // Totais globais vindos da função SQL (iguais em todas as linhas)
      const totalFuncionariosAtivos = Number(first?.total_funcionarios_ativos || 0);
      const totalCnpjsComPlano = Number(first?.total_cnpjs_com_plano || 0);
      const totalGeral = Number(first?.total_geral || 0);
      const custoMedioPorCnpj = Number(first?.custo_medio_por_cnpj || 0);

      return {
        data: results,
        totalCount,
        totalPages,
        currentPage: pageIndex,
        pageSize,
        // Expor totais globais para a UI
        totalFuncionariosAtivos,
        totalCnpjsComPlano,
        totalGeral,
        custoMedioPorCnpj,
      };
    },
    enabled: !!empresaId,
  });
};
