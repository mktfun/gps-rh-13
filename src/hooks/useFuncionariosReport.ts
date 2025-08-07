
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface FuncionariosReportKPIs {
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  taxa_cobertura: number;
}

interface EvolucaoTemporal {
  mes: string;
  mes_nome: string;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  novas_contratacoes: number;
  desligamentos: number;
}

interface DistribuicaoStatus {
  status: string;
  quantidade: number;
  percentual: number;
}

interface FuncionariosPorCNPJ {
  cnpj: string;
  razao_social: string;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  total: number;
}

interface TabelaDetalhada {
  id: string;
  nome_completo: string;
  cpf: string;
  cnpj: string;
  razao_social: string;
  status: string;
  data_admissao: string;
  data_ativacao_seguro: string;
  valor_individual: number;
  total_dependentes: number;
}

interface FuncionariosReportData {
  kpis: FuncionariosReportKPIs;
  evolucao_temporal: EvolucaoTemporal[];
  distribuicao_status: DistribuicaoStatus[];
  funcionarios_por_cnpj: FuncionariosPorCNPJ[];
  tabela_detalhada: TabelaDetalhada[];
  periodo: {
    inicio: string;
    fim: string;
  };
}

interface UseFuncionariosReportParams {
  startDate?: Date;
  endDate?: Date;
  statusFilter?: string;
  cnpjFilter?: string;
  searchTerm?: string;
}

interface RpcParams {
  p_empresa_id: string;
  p_start_date?: string;
  p_end_date?: string;
  p_status_filter?: string;
  p_cnpj_filter?: string;
  p_search_term?: string;
}

export const useFuncionariosReport = (params: UseFuncionariosReportParams = {}) => {
  const { data: empresaId } = useEmpresaId();
  
  const defaultStartDate = startOfMonth(subMonths(new Date(), 5));
  const defaultEndDate = endOfMonth(new Date());
  
  const startDate = params.startDate || defaultStartDate;
  const endDate = params.endDate || defaultEndDate;

  return useQuery({
    queryKey: [
      'funcionarios-report', 
      empresaId, 
      format(startDate, 'yyyy-MM-dd'), 
      format(endDate, 'yyyy-MM-dd'),
      params.statusFilter,
      params.cnpjFilter,
      params.searchTerm
    ],
    queryFn: async (): Promise<FuncionariosReportData> => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('🔍 [useFuncionariosReport] Buscando relatório de funcionários:', {
        empresaId,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        statusFilter: params.statusFilter,
        cnpjFilter: params.cnpjFilter,
        searchTerm: params.searchTerm
      });

      // Construir payload com tipo específico garantindo p_empresa_id obrigatório
      const rpcParams: RpcParams = {
        p_empresa_id: empresaId,
        p_start_date: format(startDate, 'yyyy-MM-dd'),
        p_end_date: format(endDate, 'yyyy-MM-dd'),
      };

      // Só adicionar parâmetros opcionais se eles tiverem valores válidos
      if (params.statusFilter && params.statusFilter !== 'all' && params.statusFilter.trim()) {
        rpcParams.p_status_filter = params.statusFilter;
      }

      if (params.cnpjFilter && params.cnpjFilter !== 'all' && params.cnpjFilter.trim()) {
        rpcParams.p_cnpj_filter = params.cnpjFilter;
      }

      if (params.searchTerm && params.searchTerm.trim()) {
        rpcParams.p_search_term = params.searchTerm;
      }

      console.log('🔍 [useFuncionariosReport] Payload tipado enviado:', rpcParams);

      const { data, error } = await supabase.rpc('get_funcionarios_report', rpcParams);

      if (error) {
        console.error('❌ [useFuncionariosReport] Erro ao buscar relatório:', error);
        throw error;
      }

      console.log('✅ [useFuncionariosReport] Relatório carregado:', data);
      
      // Safely parse the JSON data
      const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
      
      const transformedData: FuncionariosReportData = {
        kpis: parsedData?.kpis || {
          total_funcionarios: 0,
          funcionarios_ativos: 0,
          funcionarios_inativos: 0,
          taxa_cobertura: 0
        },
        evolucao_temporal: Array.isArray(parsedData?.evolucao_temporal) 
          ? parsedData.evolucao_temporal.map((item: any) => ({
              mes: item.mes || '',
              mes_nome: item.mes_nome || '',
              funcionarios_ativos: item.funcionarios_ativos || 0,
              funcionarios_inativos: item.funcionarios_inativos || 0,
              novas_contratacoes: item.novas_contratacoes || 0,
              desligamentos: item.desligamentos || 0
            }))
          : [],
        distribuicao_status: Array.isArray(parsedData?.distribuicao_status) 
          ? parsedData.distribuicao_status 
          : [],
        funcionarios_por_cnpj: Array.isArray(parsedData?.funcionarios_por_cnpj) 
          ? parsedData.funcionarios_por_cnpj 
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
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });
};
