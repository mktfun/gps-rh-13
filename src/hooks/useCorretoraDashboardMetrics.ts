
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Buscando dados do dashboard via nova RPC para corretora:', user.id);

      // Buscar dados via nova RPC
      const { data: dashboardDetails, error } = await supabase.rpc('get_dashboard_details_corretora');

      if (error) {
        console.error('Erro ao buscar detalhes do dashboard:', error);
        throw new Error(`Erro ao buscar dados: ${error.message}`);
      }

      if (!dashboardDetails) {
        console.warn('Nenhum dado retornado da função RPC');
        throw new Error('Nenhum dado retornado');
      }

      console.log('Detalhes do dashboard carregados com sucesso:', dashboardDetails);

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

      // Processar empresas recentes com dados vazios por enquanto
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

      return {
        totalEmpresas: 0,
        totalCnpjs: 0,
        totalFuncionarios: 0,
        funcionariosPendentes: 0,
        receitaMensalEstimada: 0,
        empresasRecentes,
        estatisticasMensais,
        distribuicaoPorStatus: [],
        receitaPorSeguradora: [],
        rankingEmpresas: []
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    gcTime: 1000 * 60 * 10, // Manter em cache por 10 minutos
    retry: 2,
    refetchOnWindowFocus: false // Evitar refetch desnecessário
  });
};
