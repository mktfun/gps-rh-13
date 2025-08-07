
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { startOfMonth, endOfMonth, format } from 'date-fns';

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
  
  // Usar mês atual como padrão
  const defaultStartDate = startOfMonth(new Date());
  const defaultEndDate = endOfMonth(new Date());
  
  const startDate = params.startDate || defaultStartDate;
  const endDate = params.endDate || defaultEndDate;

  return useQuery({
    queryKey: ['costs-report', empresaId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd')],
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
      return data as CostsReportData;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });
};
