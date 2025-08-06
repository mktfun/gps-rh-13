
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EmpresaDashboardMetrics {
  custoMensalTotal: number;
  totalCnpjs: number;
  totalFuncionarios: number;
  funcionariosAtivos: number;
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

      console.log('🔍 [useEmpresaDashboardMetrics] Buscando métricas para empresa:', empresaId);

      // CORREÇÃO: Chamar a função SQL com o parâmetro correto
      const { data: dashboardData, error: dashboardError } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (dashboardError) {
        console.error('❌ [useEmpresaDashboardMetrics] Erro ao buscar dados do dashboard:', dashboardError);
        throw dashboardError;
      }

      console.log('📊 [useEmpresaDashboardMetrics] Dados retornados da SQL:', dashboardData);

      // CORREÇÃO: Processar corretamente o JSON retornado pela função
      const typedData = dashboardData as any;

      // CORREÇÃO: Processar evolução mensal com a nova estrutura
      const evolucaoMensal = Array.isArray(typedData?.evolucaoMensal) 
        ? typedData.evolucaoMensal.map((item: any) => ({
            mes: String(item.mes || ''),
            funcionarios: Number(item.funcionarios || 0),
            custo: Number(item.custo || 0)
          }))
        : [];

      console.log('📈 [useEmpresaDashboardMetrics] Evolução mensal processada:', evolucaoMensal);

      // CORREÇÃO: Processar custos por CNPJ
      const custosPorCnpj = Array.isArray(typedData?.custosPorCnpj) 
        ? typedData.custosPorCnpj.map((item: any) => ({
            cnpj: String(item.cnpj || ''),
            razao_social: String(item.razao_social || ''),
            valor_mensal: Number(item.valor_mensal || 0),
            funcionarios_count: Number(item.funcionarios_count || 0)
          }))
        : [];

      console.log('💰 [useEmpresaDashboardMetrics] Custos por CNPJ processados:', custosPorCnpj);

      // CORREÇÃO: Processar distribuição de cargos
      const distribuicaoCargos = Array.isArray(typedData?.distribuicaoCargos) 
        ? typedData.distribuicaoCargos.map((item: any) => ({
            cargo: String(item.cargo || ''),
            count: Number(item.count || 0)
          }))
        : [];

      // CORREÇÃO: Processar plano principal
      const planoPrincipal = typedData?.planoPrincipal ? {
        id: String(typedData.planoPrincipal.id || ''),
        seguradora: String(typedData.planoPrincipal.seguradora || ''),
        valor_mensal: Number(typedData.planoPrincipal.valor_mensal || 0),
        cobertura_morte: Number(typedData.planoPrincipal.cobertura_morte || 0),
        cobertura_morte_acidental: Number(typedData.planoPrincipal.cobertura_morte_acidental || 0),
        cobertura_invalidez_acidente: Number(typedData.planoPrincipal.cobertura_invalidez || 0),
        cobertura_auxilio_funeral: Number(typedData.planoPrincipal.cobertura_auxilio_funeral || 0),
        razao_social: String(typedData.planoPrincipal.razao_social || ''),
      } : null;

      const resultado = {
        custoMensalTotal: Number(typedData?.custoMensalTotal || 0),
        totalCnpjs: Number(typedData?.totalCnpjs || 0),
        totalFuncionarios: Number(typedData?.totalFuncionarios || 0),
        funcionariosAtivos: Number(typedData?.funcionariosAtivos || 0),
        funcionariosPendentes: Number(typedData?.funcionariosPendentes || 0),
        custosPorCnpj,
        evolucaoMensal,
        distribuicaoCargos,
        planoPrincipal,
      };

      console.log('✅ [useEmpresaDashboardMetrics] Resultado final processado:', resultado);

      return resultado;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
