import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/types/dashboard';
import { useAuth } from '@/hooks/useAuth';

export function useDashboardData(empresaId?: string) {
  console.log('🔍 [useDashboardData] empresaId recebido:', empresaId);

  return useQuery({
    queryKey: ['dashboard-metrics', empresaId],
    queryFn: async (): Promise<DashboardMetrics> => {
      console.log('📞 [useDashboardData] Fazendo chamada RPC...');

      const { data, error } = await supabase
        .rpc('get_empresa_dashboard_metrics', {
          p_empresa_id: empresaId
        });

      console.log('📊 [useDashboardData] Resposta da RPC:', { data, error });
      
      if (error) throw error;

      return data;
    },
    enabled: true, // Sempre habilitar se empresaId for fornecido
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

// Hook simplificado que retorna apenas os dados essenciais
export function useDashboardSummary(empresaId?: string) {
  const { data, isLoading, error } = useDashboardData(empresaId);
  
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

// Hook para métricas de crescimento/tendências
export function useDashboardTrends(empresaId?: string) {
  const { data, isLoading, error } = useDashboardData(empresaId);
  
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
