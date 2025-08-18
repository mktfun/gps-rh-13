import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface RelatorioCustoEmpresaCompleto {
  cnpj_razao_social: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  valor_individual: number;
  status: string;
  total_cnpj: number;
  tipo_plano: string; // 'vida' ou 'saude'
}

interface UseRelatorioCustosEmpresaComSaudeParams {
  pageSize?: number;
  pageIndex?: number;
  filters?: {
    cnpjSearch?: string;
    statusFilter?: string;
    valorMin?: string;
    valorMax?: string;
    tipoPlanoFilter?: string;
  };
}

export const useRelatorioCustosEmpresaComSaude = (params: UseRelatorioCustosEmpresaComSaudeParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  const { pageSize = 10, pageIndex = 0, filters = {} } = params;

  return useQuery({
    queryKey: ['relatorio-custos-empresa-com-saude', empresaId, pageSize, pageIndex, filters],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 Buscando relatório de custos completo (vida + saúde):', {
        empresaId,
        pageSize,
        pageOffset: pageIndex * pageSize,
        filters
      });

      // Buscar dados dos planos de vida e saúde
      const { data: planosData, error: planosError } = await supabase
        .from('dados_planos')
        .select(`
          id,
          cnpj_id,
          valor_mensal,
          tipo_seguro,
          cnpjs!inner (
            id,
            razao_social,
            cnpj,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .in('tipo_seguro', ['vida', 'saude']);

      if (planosError) {
        console.error('❌ Erro ao buscar planos:', planosError);
        throw planosError;
      }

      // Buscar funcionários
      const { data: funcionariosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          cpf,
          status,
          cnpj_id,
          cnpjs!inner (
            id,
            razao_social,
            cnpj,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId);

      if (funcionariosError) {
        console.error('❌ Erro ao buscar funcionários:', funcionariosError);
        throw funcionariosError;
      }

      if (!planosData || !funcionariosData) {
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

      // Criar mapa de planos por CNPJ
      const planosPorCnpj = new Map();
      planosData.forEach(plano => {
        const cnpjId = plano.cnpj_id;
        if (!planosPorCnpj.has(cnpjId)) {
          planosPorCnpj.set(cnpjId, {
            cnpj_razao_social: plano.cnpjs.razao_social,
            cnpj_numero: plano.cnpjs.cnpj,
            planos: []
          });
        }
        
        const valorReal = plano.valor_mensal;
          
        planosPorCnpj.get(cnpjId).planos.push({
          tipo: plano.tipo_seguro,
          valor: valorReal || 0
        });
      });

      // Processar funcionários e gerar relatório
      const relatorioCompleto: RelatorioCustoEmpresaCompleto[] = [];
      
      funcionariosData.forEach(funcionario => {
        const cnpjId = funcionario.cnpj_id;
        const dadosCnpj = planosPorCnpj.get(cnpjId);
        
        if (!dadosCnpj || dadosCnpj.planos.length === 0) {
          // Funcionário sem planos
          relatorioCompleto.push({
            cnpj_razao_social: funcionario.cnpjs.razao_social,
            funcionario_nome: funcionario.nome,
            funcionario_cpf: funcionario.cpf,
            valor_individual: 0,
            status: funcionario.status,
            total_cnpj: 0,
            tipo_plano: 'sem_plano'
          });
          return;
        }

        // Contar funcionários ativos neste CNPJ
        const funcionariosAtivosCnpj = funcionariosData.filter(f => 
          f.cnpj_id === cnpjId && f.status === 'ativo'
        ).length;

        // Calcular valor total do CNPJ (soma de todos os planos)
        const valorTotalCnpj = dadosCnpj.planos.reduce((sum, plano) => sum + plano.valor, 0);

        // Criar apenas um registro por funcionário, somando todos os valores dos planos
        const valorIndividualTotal = funcionariosAtivosCnpj > 0 && funcionario.status === 'ativo'
          ? valorTotalCnpj / funcionariosAtivosCnpj
          : 0;

        // Identificar quais tipos de planos o funcionário tem
        const tiposPlanos = dadosCnpj.planos.map(p => p.tipo);
        const tipoPlanoDisplay = tiposPlanos.length > 1
          ? 'ambos'
          : tiposPlanos[0] || 'sem_plano';

        relatorioCompleto.push({
          cnpj_razao_social: dadosCnpj.cnpj_razao_social,
          funcionario_nome: funcionario.nome,
          funcionario_cpf: funcionario.cpf,
          valor_individual: Number(valorIndividualTotal.toFixed(2)),
          status: funcionario.status,
          total_cnpj: valorTotalCnpj,
          tipo_plano: tipoPlanoDisplay
        });
      });

      // Aplicar filtros
      let filteredResults = relatorioCompleto;

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

      if (filters.tipoPlanoFilter && filters.tipoPlanoFilter !== 'todos') {
        filteredResults = filteredResults.filter(row =>
          row.tipo_plano === filters.tipoPlanoFilter
        );
      }

      // Calcular totais
      const cnpjsUnicos = new Map();
      filteredResults.forEach(row => {
        const cnpjKey = row.cnpj_razao_social;
        if (!cnpjsUnicos.has(cnpjKey)) {
          cnpjsUnicos.set(cnpjKey, {
            total_value: row.total_cnpj,
            active_employees: 0
          });
        }

        if (row.status === 'ativo') {
          const cnpjData = cnpjsUnicos.get(cnpjKey);
          cnpjData.active_employees++;
        }
      });

      const totalFuncionariosAtivos = Array.from(cnpjsUnicos.values())
        .reduce((sum, cnpj) => sum + cnpj.active_employees, 0);

      const totalCnpjsComPlano = Array.from(cnpjsUnicos.values())
        .filter(cnpj => cnpj.total_value > 0).length;

      const totalGeral = Array.from(cnpjsUnicos.values())
        .reduce((sum, cnpj) => sum + cnpj.total_value, 0);

      const custoMedioPorCnpj = totalCnpjsComPlano > 0 ? totalGeral / totalCnpjsComPlano : 0;

      // Aplicar paginação
      const totalCount = filteredResults.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const startIndex = pageIndex * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedResults = filteredResults.slice(startIndex, endIndex);

      console.log('📊 Resultados completos (vida + saúde):', {
        total_original: relatorioCompleto.length,
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
