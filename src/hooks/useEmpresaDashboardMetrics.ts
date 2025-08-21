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

  console.log('🔍 [DEBUG] Verificando chamadas do dashboard:', {
    empresaId,
    functionCalled: 'get_empresa_dashboard_metrics',
    params: { p_empresa_id: empresaId }
  });

  console.log('📞 [DASHBOARD] Chamando RPC com:', { p_empresa_id: empresaId });

  // 🚨 CORREÇÃO: Especificar explicitamente a função com 1 parâmetro UUID
  // Evita ambiguidade com versões sem parâmetros ou com 2 parâmetros
  const { data, error } = await supabase
    .rpc('get_empresa_dashboard_metrics', {
      p_empresa_id: empresaId
    });

  console.log('📊 [DASHBOARD] Resposta RPC completa:', { data, error });

  if (error) {
    console.error('❌ [DASHBOARD] Erro na função:', error);
    console.error('❌ [DASHBOARD] Detalhes do erro:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Erro ao carregar métricas: ${error.message}`);
  }

  if (!data) {
    console.warn('💥 [DASHBOARD] Nenhum dado retornado para empresaId:', empresaId);
    throw new Error('Nenhum dado encontrado para esta empresa');
  }

  // Check if the response contains an error
  if (data?.error) {
    console.error('❌ [DASHBOARD] Function Error:', data);
    throw new Error(`Erro na função: ${data.message || 'Erro desconhecido'}`);
  }

  console.log('✅ [DASHBOARD] Dados recebidos (raw):', data);
  console.log('🧪 [TESTE DIRETO] Tipo dos dados:', typeof data);
  console.log('🧪 [TESTE DIRETO] Keys dos dados:', Object.keys(data || {}));
  console.log('🧪 [TESTE DIRETO] Valores específicos:', {
    totalFuncionarios: data.totalFuncionarios,
    funcionariosAtivos: data.funcionariosAtivos,
    custoMensalTotal: data.custoMensalTotal,
    totalCnpjs: data.totalCnpjs
  });

  // Transform data to match expected structure (snake_case to camelCase)
  return {
    totalCnpjs: Number(data.total_cnpjs) || 0,
    totalFuncionarios: Number(data.total_funcionarios) || 0,
    funcionariosAtivos: Number(data.funcionarios_ativos) || 0,
    funcionariosPendentes: Number(data.funcionarios_pendentes) || 0,
    custoMensalTotal: Number(data.custo_mensal_total) || 0,
    custosPorCnpj: Array.isArray(data.custos_por_cnpj) ? data.custos_por_cnpj : [],
    evolucaoMensal: Array.isArray(data.evolucao_mensal) ? data.evolucao_mensal : [],
    distribuicaoCargos: Array.isArray(data.distribuicao_cargos) ? data.distribuicao_cargos : [],
    planoPrincipal: data.plano_principal || undefined,
  };
};

export const useEmpresaDashboardMetrics = () => {
  const { empresaId, user } = useAuth();
  const realEmpresaId = empresaId || user?.empresa_id;

  console.log('🏢 [useEmpresaDashboardMetrics] Hook chamado com:', {
    empresaId,
    userEmpresaId: user?.empresa_id,
    realEmpresaId,
    userRole: user?.role
  });

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', realEmpresaId],
    queryFn: () => {
      console.log('🚀 [useEmpresaDashboardMetrics] Executando query com empresaId:', realEmpresaId);
      return fetchEmpresaDashboardMetrics(realEmpresaId || '');
    },
    enabled: !!realEmpresaId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      console.error(`❌ [useEmpresaDashboardMetrics] Tentativa ${failureCount} falhou:`, error);
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
