
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface CorretoraDashboardMetrics {
  totalEmpresas: number;
  totalCnpjs: number;
  totalFuncionarios: number;
  funcionariosPendentes: number;
  receitaMensalEstimada: number;
  empresasRecentes: Array<{
    id: string;
    nome: string;
    created_at: string;
    funcionarios_count: number;
    receita_mensal: number;
  }>;
  estatisticasMensais: Array<{
    mes: string;
    funcionarios: number;
    empresas: number;
    receita: number;
  }>;
  distribuicaoPorStatus: Array<{
    status: string;
    count: number;
  }>;
  receitaPorSeguradora: Array<{
    seguradora: string;
    valor_total: number;
    empresas_count: number;
  }>;
  rankingEmpresas: Array<{
    id: string;
    nome: string;
    funcionarios_count: number;
    receita_mensal: number;
  }>;
}

export const useCorretoraDashboardMetrics = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corretoraDashboardMetrics', user?.id],
    queryFn: async (): Promise<CorretoraDashboardMetrics> => {
      // CORREÇÃO: Verificação mais robusta do usuário
      if (!user?.id) {
        logger.error('❌ [useCorretoraDashboardMetrics] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      logger.info('🔍 [useCorretoraDashboardMetrics] Buscando dados do dashboard para corretora:', user.id);

      try {
        // Buscar dados via RPC
        const { data: dashboardDetails, error } = await supabase.rpc('get_dashboard_details_corretora');

        if (error) {
          logger.error('❌ [useCorretoraDashboardMetrics] Erro ao buscar detalhes do dashboard:', error);
          throw new Error(`Erro ao buscar dados: ${error.message}`);
        }

        if (!dashboardDetails) {
          logger.warn('⚠️ [useCorretoraDashboardMetrics] Nenhum dado retornado da função RPC');
          // CORREÇÃO: Retornar dados padrão ao invés de error
          return {
            totalEmpresas: 0,
            totalCnpjs: 0,
            totalFuncionarios: 0,
            funcionariosPendentes: 0,
            receitaMensalEstimada: 0,
            empresasRecentes: [],
            estatisticasMensais: [],
            distribuicaoPorStatus: [],
            receitaPorSeguradora: [],
            rankingEmpresas: []
          };
        }

        logger.info('✅ [useCorretoraDashboardMetrics] Detalhes do dashboard carregados:', dashboardDetails);

        // Processar estatísticas mensais com proteção contra NaN
        let estatisticasMensais: any[] = [];
        if (dashboardDetails && typeof dashboardDetails === 'object' && 'evolucao_mensal' in dashboardDetails) {
          estatisticasMensais = Array.isArray(dashboardDetails.evolucao_mensal) 
            ? dashboardDetails.evolucao_mensal.map((item: any) => ({
                mes: String(item.mes) || '',
                funcionarios: isNaN(Number(item.novos_funcionarios)) ? 0 : Number(item.novos_funcionarios),
                empresas: 0, // Por enquanto, focando apenas em funcionários
                receita: 0   // Por enquanto, focando apenas em funcionários
              }))
            : [];
        }

        // Processar empresas recentes
        let empresasRecentes: any[] = [];
        if (dashboardDetails && typeof dashboardDetails === 'object' && 'empresas_recentes' in dashboardDetails) {
          empresasRecentes = Array.isArray(dashboardDetails.empresas_recentes)
            ? dashboardDetails.empresas_recentes.map((item: any) => ({
                id: String(item.id) || '',
                nome: String(item.nome) || '',
                created_at: String(item.created_at) || '',
                funcionarios_count: 0, // Pode ser expandido depois
                receita_mensal: 0      // Pode ser expandido depois
              }))
            : [];
        }

        // Mapear dados reais da RPC
        const dd = dashboardDetails as any;
        return {
          totalEmpresas: Number(dd?.total_empresas) || 0,
          totalCnpjs: Number(dd?.total_cnpjs) || 0,
          totalFuncionarios: Number(dd?.total_funcionarios) || 0,
          funcionariosPendentes: Number(dd?.funcionarios_pendentes) || 0,
          receitaMensalEstimada: Number(dd?.receita_mensal_estimada) || 0,
          empresasRecentes,
          estatisticasMensais,
          distribuicaoPorStatus: Array.isArray(dd?.distribuicao_status) ? dd.distribuicao_status : [],
          receitaPorSeguradora: Array.isArray(dd?.receita_por_seguradora) ? dd.receita_por_seguradora : [],
          rankingEmpresas: Array.isArray(dd?.ranking_empresas) ? dd.ranking_empresas : []
        };
      } catch (error) {
        logger.error('❌ [useCorretoraDashboardMetrics] Erro na execução:', error);
        throw error;
      }
    },
    enabled: !!user?.id, // CORREÇÃO: Garantir que só executa com usuário válido
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    gcTime: 1000 * 60 * 10, // Manter em cache por 10 minutos
    retry: (failureCount, error: any) => {
      // CORREÇÃO: Não fazer retry se não há usuário autenticado
      if (!user?.id) {
        logger.info('🚫 [useCorretoraDashboardMetrics] Não fazendo retry - usuário não autenticado');
        return false;
      }
      
      logger.info(`🔄 [useCorretoraDashboardMetrics] Retry ${failureCount}/2:`, error?.message);
      return failureCount < 2;
    },
    retryDelay: 1000,
    refetchOnWindowFocus: false // Evitar refetch desnecessário
  });
};
