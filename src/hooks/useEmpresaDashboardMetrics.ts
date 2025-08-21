import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardMetrics {
  totalCnpjs: number;
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosPendentes: number;
  custoMensalTotal: number;
  custosPorCnpj: {
    cnpj: string;
    razao_social: string;
    valor_mensal: number;
    funcionarios_count: number;
  }[];
  evolucaoMensal: {
    mes: string;
    funcionarios: number;
    custo: number;
  }[];
  distribuicaoCargos: {
    cargo: string;
    count: number;
  }[];
  planoPrincipal?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    razao_social: string;
    tipo_seguro: string;
  };
}

const fetchEmpresaDashboardMetrics = async (empresaId: string): Promise<DashboardMetrics> => {
  if (!empresaId) {
    throw new Error('ID da empresa é obrigatório');
  }

  console.log('🔍 [fetchEmpresaDashboardMetrics] Buscando dados para empresa:', empresaId);

  const { data, error } = await supabase
    .rpc('get_empresa_dashboard_metrics', {
      p_empresa_id: empresaId
    });

  if (error) {
    console.error('❌ [fetchEmpresaDashboardMetrics] RPC Error:', error);
    throw new Error(`Erro ao carregar métricas: ${error.message}`);
  }

  if (!data) {
    console.warn('⚠️ [fetchEmpresaDashboardMetrics] Nenhum dado retornado');
    throw new Error('Nenhum dado encontrado para esta empresa');
  }

  // Check if the response contains an error
  if (data?.error) {
    console.error('❌ [fetchEmpresaDashboardMetrics] Function Error:', data);
    throw new Error(`Erro na função: ${data.message || 'Erro desconhecido'}`);
  }

  console.log('✅ [fetchEmpresaDashboardMetrics] Dados recebidos:', data);

  // Transform data to match expected structure
  return {
    totalCnpjs: Number(data.totalCnpjs) || 0,
    totalFuncionarios: Number(data.totalFuncionarios) || 0,
    funcionariosAtivos: Number(data.funcionariosAtivos) || 0,
    funcionariosPendentes: Number(data.funcionariosPendentes) || 0,
    custoMensalTotal: Number(data.custoMensalTotal) || 0,
    custosPorCnpj: Array.isArray(data.custosPorCnpj) ? data.custosPorCnpj : [],
    evolucaoMensal: Array.isArray(data.evolucaoMensal) ? data.evolucaoMensal : [],
    distribuicaoCargos: Array.isArray(data.distribuicaoCargos) ? data.distribuicaoCargos : [],
    planoPrincipal: data.planoPrincipal || undefined,
  };
};

export const useEmpresaDashboardMetrics = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', empresaId],
    queryFn: () => fetchEmpresaDashboardMetrics(empresaId || ''),
    enabled: !!empresaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.error(`❌ [useEmpresaDashboardMetrics] Tentativa ${failureCount} falhou:`, error);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
