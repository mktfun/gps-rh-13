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

  console.log('🔍 [DEBUG] Buscando dados completos do dashboard para:', empresaId);

  try {
    // 1. Buscar métricas principais
    const { data: mainData, error: mainError } = await supabase
      .rpc('get_empresa_dashboard_metrics', {
        p_empresa_id: empresaId
      });

    if (mainError) throw mainError;
    if (!mainData) throw new Error('Nenhum dado principal encontrado');

    console.log('✅ [DASHBOARD] Dados principais:', mainData);

    // 2. Buscar dados dos CNPJs/Planos
    const { data: planosData, error: planosError } = await supabase
      .rpc('get_empresa_planos_unificados', {
        p_empresa_id: empresaId
      });

    if (planosError) {
      console.warn('⚠️ [DASHBOARD] Erro ao buscar planos:', planosError);
    }

    console.log('✅ [DASHBOARD] Dados dos planos:', planosData);

    // 3. Buscar distribuição de cargos
    const { data: cargosData, error: cargosError } = await supabase
      .rpc('get_empresa_distribuicao_cargos');

    if (cargosError) {
      console.warn('⚠️ [DASHBOARD] Erro ao buscar cargos:', cargosError);
    }

    console.log('✅ [DASHBOARD] Dados dos cargos:', cargosData);

    // 4. Buscar evolução mensal
    const { data: evolucaoData, error: evolucaoError } = await supabase
      .rpc('get_empresa_evolucao_mensal');

    if (evolucaoError) {
      console.warn('⚠️ [DASHBOARD] Erro ao buscar evolução:', evolucaoError);
    }

    console.log('✅ [DASHBOARD] Dados da evolução:', evolucaoData);

    // 5. Processar dados dos CNPJs/custos
    const custosPorCnpj = planosData ? planosData.map((plano: any) => ({
      cnpj: plano.cnpj_numero,
      razao_social: plano.cnpj_razao_social,
      valor_mensal: plano.custo_mensal_real || 0,
      funcionarios_count: plano.total_funcionarios || 0
    })) : [];

    // 6. Processar evolução mensal (converter formato se necessário)
    const evolucaoMensal = evolucaoData ? evolucaoData.map((item: any) => ({
      mes: item.mes,
      funcionarios: item.novos_funcionarios || 0,
      custo: 0 // Pode ser calculado ou vir de outra fonte
    })) : [];

    // 7. Buscar plano principal (maior valor)
    const planoPrincipal = planosData && planosData.length > 0
      ? planosData.reduce((max: any, current: any) =>
          (current.custo_mensal_real || 0) > (max.custo_mensal_real || 0) ? current : max
        )
      : null;

    const planoPrincipalFormatted = planoPrincipal ? {
      seguradora: planoPrincipal.seguradora,
      valor_mensal: planoPrincipal.valor_unitario || 0,
      cobertura_morte: planoPrincipal.cobertura_morte || 0,
      cobertura_morte_acidental: planoPrincipal.cobertura_morte_acidental || 0,
      cobertura_invalidez_acidente: planoPrincipal.cobertura_invalidez_acidente || 0,
      razao_social: planoPrincipal.cnpj_razao_social,
      tipo_seguro: 'Seguro de Vida'
    } : undefined;

    // Transform data to match expected structure
    return {
      totalCnpjs: Number(mainData.total_cnpjs) || 0,
      totalFuncionarios: Number(mainData.total_funcionarios) || 0,
      funcionariosAtivos: Number(mainData.funcionarios_ativos) || 0,
      funcionariosPendentes: Number(mainData.funcionarios_pendentes) || 0,
      custoMensalTotal: Number(mainData.custo_mensal_total) || 0,
      custosPorCnpj: custosPorCnpj,
      evolucaoMensal: evolucaoMensal,
      distribuicaoCargos: Array.isArray(cargosData) ? cargosData : [],
      planoPrincipal: planoPrincipalFormatted,
    };

  } catch (error: any) {
    console.error('❌ [DASHBOARD] Erro ao buscar dados:', error);
    throw new Error(`Erro ao carregar dados do dashboard: ${error.message}`);
  }
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
