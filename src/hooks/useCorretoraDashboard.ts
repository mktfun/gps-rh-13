
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CorretoraDashboardMetrics {
  total_empresas: number;
  total_cnpjs: number;
  total_funcionarios: number;
  total_pendencias: number;
}

export const useCorretoraDashboard = () => {
  const { user } = useAuth();

  const fetchMetrics = async (): Promise<CorretoraDashboardMetrics> => {
    console.log('Buscando métricas do dashboard via RPC para corretora:', user?.id);

    const { data, error } = await supabase.rpc('get_corretora_dashboard_metrics');

    if (error) {
      console.error('Erro ao buscar métricas do dashboard via RPC:', error);
      throw new Error('Não foi possível carregar os indicadores gerais.');
    }

    console.log('Métricas do dashboard carregadas via RPC:', data);
    
    // Safely cast the data with proper validation
    const metrics = data as unknown as CorretoraDashboardMetrics;
    
    return {
      total_empresas: Number(metrics.total_empresas) || 0,
      total_cnpjs: Number(metrics.total_cnpjs) || 0,
      total_funcionarios: Number(metrics.total_funcionarios) || 0,
      total_pendencias: Number(metrics.total_pendencias) || 0,
    };
  };

  return useQuery({
    queryKey: ['corretoraDashboardMetrics', user?.id],
    queryFn: fetchMetrics,
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
    refetchOnWindowFocus: true
  });
};
