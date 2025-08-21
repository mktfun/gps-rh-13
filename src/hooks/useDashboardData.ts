// ❌ DEPRECATED - Use useEmpresaDashboardMetrics instead
// Este arquivo foi mantido por compatibilidade, mas será removido
// Todas as funções redirecionam para o hook correto

import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';

/**
 * @deprecated Use useEmpresaDashboardMetrics instead
 */
export function useDashboardData(empresaId?: string) {
  console.warn('⚠️ [useDashboardData] DEPRECATED - Use useEmpresaDashboardMetrics instead');
  return useEmpresaDashboardMetrics();
}

/**
 * @deprecated Use useEmpresaDashboardMetrics instead
 */
export function useDashboardSummary(empresaId?: string) {
  console.warn('⚠️ [useDashboardSummary] DEPRECATED - Use useEmpresaDashboardMetrics instead');
  const { data, isLoading, error } = useEmpresaDashboardMetrics();
  
  return {
    totalFuncionarios: data?.totalFuncionarios || 0,
    funcionariosAtivos: data?.funcionariosAtivos || 0,
    funcionariosPendentes: data?.funcionariosPendentes || 0,
    totalCnpjs: data?.totalCnpjs || 0,
    custoMensalTotal: data?.custoMensalTotal || 0,
    isLoading,
    error,
  };
}

/**
 * @deprecated Use local calculation instead
 */
export function useDashboardTrends(empresaId?: string) {
  console.warn('⚠️ [useDashboardTrends] DEPRECATED - Calculate trends locally');
  const { data, isLoading, error } = useEmpresaDashboardMetrics();
  
  const calculateTrend = (evolutionData: any[]) => {
    if (!evolutionData || evolutionData.length < 2) return 'neutral';
    
    const current = evolutionData[evolutionData.length - 1];
    const previous = evolutionData[evolutionData.length - 2];
    
    if (current.funcionarios > previous.funcionarios) return 'up';
    if (current.funcionarios < previous.funcionarios) return 'down';
    return 'neutral';
  };

  const funcionariosTrend = data?.evolucaoMensal ? calculateTrend(data.evolucaoMensal) : 'neutral';
  
  return {
    funcionariosTrend,
    hasGrowth: funcionariosTrend === 'up',
    isLoading,
    error,
  };
}
