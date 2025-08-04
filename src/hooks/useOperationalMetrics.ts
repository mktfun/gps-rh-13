
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface OperationalMetrics {
  produtividade_carteira: number;
  eficiencia_ativacao: number;
  qualidade_gestao: number;
  crescimento_carteira: number;
  velocidade_resposta: number;
  cobertura_seguros: number;
  alertas: {
    funcionarios_travados: number;
    cnpjs_sem_plano: number;
    empresas_inativas: number;
  };
}

export const useOperationalMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['operational-metrics', user?.id],
    queryFn: async (): Promise<OperationalMetrics> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_operational_metrics_corretor');

      if (error) {
        console.error('Erro ao buscar métricas operacionais:', error);
        throw error;
      }

      // Type assertion para tratar o retorno Json do Supabase
      const metricsData = data as any;

      return {
        produtividade_carteira: Number(metricsData.produtividade_carteira) || 0,
        eficiencia_ativacao: Number(metricsData.eficiencia_ativacao) || 0,
        qualidade_gestao: Number(metricsData.qualidade_gestao) || 0,
        crescimento_carteira: Number(metricsData.crescimento_carteira) || 0,
        velocidade_resposta: Number(metricsData.velocidade_resposta) || 0,
        cobertura_seguros: Number(metricsData.cobertura_seguros) || 0,
        alertas: {
          funcionarios_travados: Number(metricsData.alertas?.funcionarios_travados) || 0,
          cnpjs_sem_plano: Number(metricsData.alertas?.cnpjs_sem_plano) || 0,
          empresas_inativas: Number(metricsData.alertas?.empresas_inativas) || 0,
        }
      };
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Auto-refresh a cada 1 minuto
    staleTime: 30000,
  });
};
