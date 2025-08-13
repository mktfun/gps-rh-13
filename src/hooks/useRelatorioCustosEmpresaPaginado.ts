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
    queryKey: ['relatorio-custos-empresa-paginado', empresaId, pageSize, pageIndex, filters],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Buscando relatório de custos com filtros:', {
        empresaId,
        pageSize,
        pageOffset: pageIndex * pageSize,
        filters
      });

      // STEP 1: Fetch ALL data first to calculate correct totals (not affected by pagination)
      const { data: allData, error: allDataError } = await supabase.rpc('get_relatorio_custos_empresa', {
        p_empresa_id: empresaId,
        p_page_size: 1000, // Large number to get all data
        p_page_offset: 0
      });

      if (allDataError) {
        console.error('❌ Erro ao buscar todos os dados:', allDataError);
        throw allDataError;
      }

      if (!allData || allData.length === 0) {
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

      console.log('✅ Todos os dados carregados (raw):', allData.length, 'registros');

      const rawResults = (allData || []) as RelatorioCustoEmpresaPaginado[];

      // STEP 2: Deduplicate and clean data
      const employeeMap = new Map();
      const cnpjTotals = new Map();

      rawResults.forEach(row => {
        const cnpjKey = row.cnpj_razao_social;
        if (!cnpjTotals.has(cnpjKey)) {
          cnpjTotals.set(cnpjKey, {
            total_value: 0,
            active_employees: 0,
            employees: []
          });
        }

        const cnpjData = cnpjTotals.get(cnpjKey);
        const empKey = `${cnpjKey}_${row.funcionario_cpf}`;

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

      const cleanedResults = Array.from(employeeMap.values()).map(row => {
        const cnpjKey = row.cnpj_razao_social;
        const cnpjData = cnpjTotals.get(cnpjKey);

        const valor_individual = row.status === 'ativo' && cnpjData.active_employees > 0
          ? cnpjData.total_value / cnpjData.active_employees
          : 0;

        return {
          ...row,
          valor_individual: Number(valor_individual.toFixed(2)),
          total_cnpj: cnpjData.total_value
        };
      });

      // STEP 3: Apply filters
      let filteredResults = cleanedResults;

      if (filters.cnpjSearch) {
        const searchTerm = filters.cnpjSearch.toLowerCase();
        filteredResults = filteredResults.filter(row =>
          row.cnpj_razao_social.toLowerCase().includes(searchTerm)
        );
      }

      if (filters.statusFilter && filters.statusFilter !== 'todos') {
        filteredResults = filteredResults.filter(row =>
          row.status === filters.statusFilter
        );
      }

      if (filters.valorMin) {
        const minValue = parseFloat(filters.valorMin);
        if (!isNaN(minValue)) {
          filteredResults = filteredResults.filter(row =>
            row.valor_individual >= minValue
          );
        }
      }

      if (filters.valorMax) {
        const maxValue = parseFloat(filters.valorMax);
        if (!isNaN(maxValue)) {
          filteredResults = filteredResults.filter(row =>
            row.valor_individual <= maxValue
          );
        }
      }

      // STEP 4: Calculate totals from ALL filtered data (not just current page)
      const uniqueCnpjs = new Map();
      filteredResults.forEach(row => {
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

      const totalFuncionariosAtivos = Array.from(uniqueCnpjs.values())
        .reduce((sum, cnpj) => sum + cnpj.active_employees, 0);

      const totalCnpjsComPlano = Array.from(uniqueCnpjs.values())
        .filter(cnpj => cnpj.total_value > 0).length;

      const totalGeral = Array.from(uniqueCnpjs.values())
        .reduce((sum, cnpj) => sum + cnpj.total_value, 0);

      const custoMedioPorCnpj = totalCnpjsComPlano > 0 ? totalGeral / totalCnpjsComPlano : 0;

      // STEP 5: Apply pagination to filtered results
      const totalCount = filteredResults.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = pageIndex * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);

      console.log('📊 Resultados finais:', {
        total_original: rawResults.length,
        total_cleaned: cleanedResults.length,
        total_filtered: filteredResults.length,
        paginated_count: paginatedResults.length,
        totals: {
          totalFuncionariosAtivos,
          totalCnpjsComPlano,
          totalGeral,
          custoMedioPorCnpj
        }
      });

      return {
        data: paginatedResults,
        totalCount,
        totalPages,
        currentPage: pageIndex,
        pageSize,
        totalFuncionariosAtivos,
        totalCnpjsComPlano,
        totalGeral,
        custoMedioPorCnpj,
      };
    },
    enabled: !!empresaId,
  });
};
