import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface CostsReportKPIs {
  custo_total_periodo: number;
  custo_medio_funcionario: number;
  variacao_percentual: number;
  total_funcionarios_ativos: number;
}

interface EvolucaoTemporal {
  mes: string;
  mes_nome: string;
  custo_total: number;
  funcionarios: number;
}

interface DistribuicaoCNPJ {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_ativos: number;
  custo_por_funcionario: number;
  percentual_total: number;
}

interface TabelaDetalhada {
  cnpj_id: string;
  cnpj: string;
  razao_social: string;
  seguradora: string;
  valor_mensal: number;
  funcionarios_ativos: number;
  custo_por_funcionario: number;
  data_inicio_plano: string;
  tipo_seguro: string;
}

interface CostsReportData {
  kpis: CostsReportKPIs;
  evolucao_temporal: EvolucaoTemporal[];
  distribuicao_cnpjs: DistribuicaoCNPJ[];
  tabela_detalhada: TabelaDetalhada[];
  periodo: {
    inicio: string;
    fim: string;
  };
}

interface UseCostsReportParams {
  startDate?: Date;
  endDate?: Date;
}

export const useCostsReport = (params: UseCostsReportParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  
  // Expandir para últimos 6 meses para melhor visualização histórica
  const defaultStartDate = startOfMonth(subMonths(new Date(), 5)); // 6 meses atrás
  const defaultEndDate = endOfMonth(new Date());
  
  const startDate = params.startDate || defaultStartDate;
  const endDate = params.endDate || defaultEndDate;

  return useQuery({
    queryKey: ['costs-report', empresaId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'), 'v2'], // v2 para forçar refresh
    queryFn: async (): Promise<CostsReportData> => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 [useCostsReport] Buscando relatório de custos:', {
        empresaId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd')
      });

      const { data, error } = await supabase.rpc('get_detailed_costs_report', {
        p_empresa_id: empresaId,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd')
      });

      if (error) {
        console.error('❌ [useCostsReport] Erro ao buscar relatório:', error);
        throw error;
      }

      console.log('✅ [useCostsReport] Relatório carregado:', data);

      // Safely parse the JSON data
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

      // Validate and fix KPIs if they show as zero
      const kpis = parsedData?.kpis || {};
      const fixedKpis = {
        custo_total_periodo: Number(kpis.custo_total_periodo || 0),
        custo_medio_funcionario: Number(kpis.custo_medio_funcionario || 0),
        variacao_percentual: Number(kpis.variacao_percentual || 0),
        total_funcionarios_ativos: Number(kpis.total_funcionarios_ativos || 0)
      };

      // If KPIs are zero but we have detailed data, recalculate from detailed data
      const tabelaDetalhada = parsedData?.tabela_detalhada || [];
      if (fixedKpis.custo_total_periodo === 0 && tabelaDetalhada.length > 0) {
        fixedKpis.custo_total_periodo = tabelaDetalhada.reduce((sum: number, item: any) =>
          sum + Number(item.valor_mensal || 0), 0);

        const totalFuncionarios = tabelaDetalhada.reduce((sum: number, item: any) =>
          sum + Number(item.funcionarios_ativos || 0), 0);

        if (totalFuncionarios > 0) {
          fixedKpis.custo_medio_funcionario = fixedKpis.custo_total_periodo / totalFuncionarios;
        }
        fixedKpis.total_funcionarios_ativos = totalFuncionarios;

        console.log('🔧 [useCostsReport] KPIs recalculados:', fixedKpis);
      }

      // Transform the data to ensure it matches our interface
      const transformedData: CostsReportData = {
        kpis: fixedKpis,
        evolucao_temporal: Array.isArray(parsedData?.evolucao_temporal) 
          ? parsedData.evolucao_temporal.map((item: any) => ({
              mes: item.mes || '',
              mes_nome: item.mes_nome || '',
              custo_total: item.custo_total || 0,
              funcionarios: item.funcionarios || 0
            }))
          : [],
        distribuicao_cnpjs: Array.isArray(parsedData?.distribuicao_cnpjs) 
          ? parsedData.distribuicao_cnpjs 
          : [],
        tabela_detalhada: Array.isArray(parsedData?.tabela_detalhada) 
          ? parsedData.tabela_detalhada 
          : [],
        periodo: parsedData?.periodo || {
          inicio: format(startDate, 'yyyy-MM-dd'),
          fim: format(endDate, 'yyyy-MM-dd')
        }
      };

      return transformedData;
    },
    enabled: !!empresaId,
    staleTime: 0, // Desabilitar cache temporariamente
    gcTime: 1000 * 60 * 1, // 1 minuto
  });
};
