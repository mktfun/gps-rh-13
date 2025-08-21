import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DashboardMetrics {
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  total_planos: number;
  custo_mensal_total: number;
}

export const useEmpresaDashboardMetrics = (empresaId: string) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!empresaId) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: rpcError } = await supabase
          .rpc('get_empresa_dashboard_metrics', { 
            p_empresa_id: empresaId 
          });

        if (rpcError) {
          console.error('RPC Error:', rpcError);
          setError(`Erro ao carregar métricas: ${rpcError.message}`);
          return;
        }

        // Check if the response contains an error
        if (data?.error) {
          console.error('Function Error:', data);
          setError(`Erro na função: ${data.message} (${data.code})`);
          return;
        }

        // Ensure data has the correct structure
        const metricsData: DashboardMetrics = {
          total_funcionarios: Number(data.totalFuncionarios) || 0,
          funcionarios_ativos: Number(data.funcionariosAtivos) || 0,
          funcionarios_pendentes: Number(data.funcionariosPendentes) || 0,
          total_planos: Number(data.totalCnpjs) || 0,
          custo_mensal_total: Number(data.custoMensalTotal) || 0,
        };

        setMetrics(metricsData);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Erro inesperado ao carregar métricas');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [empresaId]);

  return { metrics, loading, error };
};
