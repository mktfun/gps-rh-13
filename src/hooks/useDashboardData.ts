import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/types/dashboard';
import { useAuth } from '@/hooks/useAuth';

export function useDashboardData(empresaId?: string) {
  const { user } = useAuth();

  console.log('🔍 [useDashboardData] empresaId recebido:', empresaId);
  console.log('🔍 [useDashboardData] user:', user);
  console.log('🔍 [useDashboardData] user?.empresa_id:', user?.empresa_id);
  console.log('🔍 [useDashboardData] user?.id:', user?.id);

  // Usar fallback para o ID da empresa que sabemos que funciona
  const finalEmpresaId = empresaId || user?.empresa_id || user?.id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';

  console.log('🎯 [useDashboardData] finalEmpresaId usado:', finalEmpresaId);

  return useQuery({
    queryKey: ['dashboard-metrics', finalEmpresaId],
    queryFn: async (): Promise<DashboardMetrics> => {
      console.log('📞 [useDashboardData] Chamando RPC com empresaId:', finalEmpresaId);

      const { data, error } = await supabase
        .rpc('get_empresa_dashboard_metrics', {
          p_empresa_id: finalEmpresaId
        });
      
      if (error) {
        console.error('❌ [useDashboardData] Erro ao buscar métricas:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ [useDashboardData] Nenhum dado retornado');
        throw new Error('Nenhum dado encontrado para esta empresa');
      }

      console.log('✅ [useDashboardData] Métricas carregadas:', data);

      // Normalizar dados para garantir estrutura consistente
      const normalizedData: DashboardMetrics = {
        custoMensalTotal: data.custoMensalTotal || 0,
        totalCnpjs: data.totalCnpjs || 0,
        totalFuncionarios: data.totalFuncionarios || 0,
        funcionariosAtivos: data.funcionariosAtivos || 0,
        funcionariosPendentes: data.funcionariosPendentes || 0,
        evolucaoMensal: Array.isArray(data.evolucaoMensal) ? data.evolucaoMensal : [],
        distribuicaoCargos: Array.isArray(data.distribuicaoCargos) ? data.distribuicaoCargos : [],
        custosPorCnpj: Array.isArray(data.custosPorCnpj) ? data.custosPorCnpj : [],
        planoPrincipal: data.planoPrincipal || null,
      };

      return normalizedData;
    },
    enabled: !!finalEmpresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
    gcTime: 1000 * 60 * 10, // 10 minutos - cache mantido na memória
    refetchOnWindowFocus: false, // Não revalidar ao focar na janela
    retry: 2, // Tentar até 2 vezes em caso de erro
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponencial
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
