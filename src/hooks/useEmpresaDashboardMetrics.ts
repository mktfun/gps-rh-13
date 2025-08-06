
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmpresaDashboardMetrics {
  custoMensalTotal: number;
  totalCnpjs: number;
  totalFuncionarios: number;
  funcionariosAtivos: number; // Added missing field
  funcionariosPendentes: number;
  custosPorCnpj: Array<{
    cnpj: string;
    razao_social: string;
    valor_mensal: number;
    funcionarios_count: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    funcionarios: number;
    custo: number;
  }>;
  distribuicaoCargos: Array<{
    cargo: string;
    count: number;
  }>;
  planoPrincipal: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    cobertura_auxilio_funeral: number;
    razao_social: string;
  } | null;
}

export const useEmpresaDashboardMetrics = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', empresaId],
    queryFn: async (): Promise<EmpresaDashboardMetrics> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      console.log('🔍 Buscando métricas do dashboard para empresa:', empresaId);

      // Buscar dados básicos do dashboard
      const { data: dashboardData, error: dashboardError } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (dashboardError) {
        console.error('❌ Erro ao buscar dados do dashboard:', dashboardError);
        throw dashboardError;
      }

      // Type cast the JSON response properly
      const typedData = dashboardData as any;

      // CORREÇÃO: Buscar plano principal com todas as coberturas via JOIN
      const { data: planoPrincipalData, error: planoError } = await supabase
        .from('dados_planos')
        .select(`
          id,
          seguradora,
          valor_mensal,
          cobertura_morte,
          cobertura_morte_acidental,
          cobertura_invalidez_acidente,
          cobertura_auxilio_funeral,
          cnpjs!inner(
            id,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('cnpjs.status', 'ativo')
        .order('valor_mensal', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (planoError) {
        console.error('❌ Erro ao buscar plano principal:', planoError);
      }

      // Processar plano principal com coberturas completas
      const planoPrincipal = planoPrincipalData ? {
        id: planoPrincipalData.id,
        seguradora: planoPrincipalData.seguradora,
        valor_mensal: planoPrincipalData.valor_mensal,
        cobertura_morte: planoPrincipalData.cobertura_morte || 0,
        cobertura_morte_acidental: planoPrincipalData.cobertura_morte_acidental || 0,
        cobertura_invalidez_acidente: planoPrincipalData.cobertura_invalidez_acidente || 0,
        cobertura_auxilio_funeral: planoPrincipalData.cobertura_auxilio_funeral || 0,
        razao_social: planoPrincipalData.cnpjs?.razao_social || '',
      } : null;

      console.log('✅ Plano principal com coberturas:', planoPrincipal);

      return {
        custoMensalTotal: typedData?.custoMensalTotal || 0,
        totalCnpjs: typedData?.totalCnpjs || 0,
        totalFuncionarios: typedData?.totalFuncionarios || 0,
        funcionariosAtivos: typedData?.funcionariosAtivos || 0,
        funcionariosPendentes: typedData?.funcionariosPendentes || 0,
        custosPorCnpj: typedData?.custosPorCnpj || [],
        evolucaoMensal: typedData?.evolucaoMensal || [],
        distribuicaoCargos: typedData?.distribuicaoCargos || [],
        planoPrincipal,
      };
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
