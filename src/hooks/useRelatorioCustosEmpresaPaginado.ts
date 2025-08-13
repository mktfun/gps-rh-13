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
  filters?: {
    cnpjSearch?: string;
    statusFilter?: string;
    valorMin?: string;
    valorMax?: string;
  };
}

export const useRelatorioCustosEmpresaPaginado = (params: UseRelatorioCustosEmpresaPaginadoParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { pageSize = 10, pageIndex = 0, filters = {} } = params;

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

      if (!data || data.length === 0) {
        console.warn('⚠️ Nenhum dado retornado do relatório de custos');
        return {
          data: [],
          totalCount: 0,
          totalPages: 0,
          currentPage: pageIndex,
          pageSize,
          totalFuncionariosAtivos: 0,
          totalCnpjsComPlano: 0,
          totalGeral: 0,
          custoMedioPorCnpj: 0,
        };
      }

      console.log('✅ Relatório de custos paginado carregado (raw):', data);

      const rawResults = (data || []) as RelatorioCustoEmpresaPaginado[];

      // Deduplicate employees and calculate correct individual values
      const employeeMap = new Map();
      const cnpjTotals = new Map();

      // First pass: collect CNPJ totals and count active employees per CNPJ
      rawResults.forEach(row => {
        const cnpjKey = row.cnpj_razao_social;
        if (!cnpjTotals.has(cnpjKey)) {
          cnpjTotals.set(cnpjKey, {
            total_value: 0, // Will be set properly below
            active_employees: 0,
            employees: []
          });
        }

        const cnpjData = cnpjTotals.get(cnpjKey);
        const empKey = `${cnpjKey}_${row.funcionario_cpf}`;

        // Set the correct total value (take the maximum non-zero value)
        if (row.total_cnpj > cnpjData.total_value) {
          cnpjData.total_value = row.total_cnpj;
        }

        if (!employeeMap.has(empKey)) {
          employeeMap.set(empKey, row);
          cnpjData.employees.push(row);
          if (row.status === 'ativo') {
            cnpjData.active_employees++;
          }
        }
      });

      // Second pass: calculate correct individual values
      const results = Array.from(employeeMap.values()).map(row => {
        const cnpjKey = row.cnpj_razao_social;
        const cnpjData = cnpjTotals.get(cnpjKey);

        // Calculate individual value as plan total divided by active employees
        const valor_individual = row.status === 'ativo' && cnpjData.active_employees > 0
          ? cnpjData.total_value / cnpjData.active_employees
          : 0;

        return {
          ...row,
          valor_individual: Number(valor_individual.toFixed(2)),
          total_cnpj: cnpjData.total_value // Always use the correct total value
        };
      });

      console.log('✅ Relatório deduplicated and corrected:', {
        original_count: rawResults.length,
        deduplicated_count: results.length,
        cnpj_counts: Array.from(cnpjTotals.entries()).map(([cnpj, data]) => ({
          cnpj,
          total: data.total_value,
          active_employees: data.active_employees,
          total_employees: data.employees.length
        }))
      });

      const first = rawResults[0];
      const totalCount = results.length; // Use deduplicated count
      const totalPages = Math.ceil(totalCount / pageSize);

      // Totais globais vindos da função SQL (iguais em todas as linhas)
      let totalFuncionariosAtivos = Number(first?.total_funcionarios_ativos || 0);
      let totalCnpjsComPlano = Number(first?.total_cnpjs_com_plano || 0);
      let totalGeral = Number(first?.total_geral || 0);
      let custoMedioPorCnpj = Number(first?.custo_medio_por_cnpj || 0);

      // Sempre recalcular totais para garantir valores corretos
      if (results.length > 0) {
        console.log('🔧 Recalculando totais a partir dos dados recebidos');

        const uniqueCnpjs = new Map();
        results.forEach(row => {
          const cnpjKey = row.cnpj_razao_social;
          if (!uniqueCnpjs.has(cnpjKey)) {
            uniqueCnpjs.set(cnpjKey, {
              total_value: row.total_cnpj || 0,
              active_employees: 0
            });
          }

          if (row.status === 'ativo') {
            const cnpjData = uniqueCnpjs.get(cnpjKey);
            cnpjData.active_employees++;
          }
        });

        // Calcular totais corretos
        totalFuncionariosAtivos = Array.from(uniqueCnpjs.values())
          .reduce((sum, cnpj) => sum + cnpj.active_employees, 0);

        totalCnpjsComPlano = Array.from(uniqueCnpjs.values())
          .filter(cnpj => cnpj.total_value > 0).length;

        totalGeral = Array.from(uniqueCnpjs.values())
          .reduce((sum, cnpj) => sum + cnpj.total_value, 0);

        custoMedioPorCnpj = totalCnpjsComPlano > 0 ? totalGeral / totalCnpjsComPlano : 0;

        console.log('📊 Totais recalculados:', {
          totalFuncionariosAtivos,
          totalCnpjsComPlano,
          totalGeral,
          custoMedioPorCnpj
        });
      }

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
