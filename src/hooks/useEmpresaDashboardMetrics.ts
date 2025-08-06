
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

      // Buscar dados básicos do dashboard
      const { data: dashboardData, error: dashboardError } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { p_empresa_id: empresaId }
      );

      if (dashboardError) {
        console.error('❌ [useEmpresaDashboardMetrics] Erro ao buscar dados do dashboard:', dashboardError);
        throw dashboardError;
      }

      console.log('📊 [useEmpresaDashboardMetrics] Dados brutos da SQL:', dashboardData);

      // CORREÇÃO: Cast correto do resultado JSON
      const typedData = dashboardData as any;
      console.log('📋 [useEmpresaDashboardMetrics] Dados tipados:', typedData);

      // CORREÇÃO: Buscar funcionários ativos manualmente se não vier da SQL
      const { data: funcionariosAtivosData, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select('id, status')
        .eq('status', 'ativo')
        .in('cnpj_id', 
          await supabase
            .from('cnpjs')
            .select('id')
            .eq('empresa_id', empresaId)
            .then(result => result.data?.map(c => c.id) || [])
        );

      if (funcionariosError) {
        console.error('❌ [useEmpresaDashboardMetrics] Erro ao buscar funcionários ativos:', funcionariosError);
      }

      const funcionariosAtivos = funcionariosAtivosData?.length || 0;
      console.log('👥 [useEmpresaDashboardMetrics] Funcionários ativos encontrados:', funcionariosAtivos);

      // CORREÇÃO: Buscar plano principal com todas as coberturas
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
        console.error('❌ [useEmpresaDashboardMetrics] Erro ao buscar plano principal:', planoError);
      }

      console.log('💼 [useEmpresaDashboardMetrics] Plano principal encontrado:', planoPrincipalData);

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

      // CORREÇÃO: Processar dados de custos por CNPJ
      const custosPorCnpj = Array.isArray(typedData?.custosPorCnpj) 
        ? typedData.custosPorCnpj 
        : [];

      console.log('💰 [useEmpresaDashboardMetrics] Custos por CNPJ processados:', custosPorCnpj);

      // CORREÇÃO: Processar evolução mensal
      const evolucaoMensal = Array.isArray(typedData?.evolucaoMensal) 
        ? typedData.evolucaoMensal 
        : [];

      console.log('📈 [useEmpresaDashboardMetrics] Evolução mensal processada:', evolucaoMensal);

      const resultado = {
        custoMensalTotal: Number(typedData?.custoMensalTotal || 0),
        totalCnpjs: Number(typedData?.totalCnpjs || 0),
        totalFuncionarios: Number(typedData?.totalFuncionarios || 0),
        funcionariosAtivos, // CORREÇÃO: Usar o valor calculado manualmente
        funcionariosPendentes: Number(typedData?.funcionariosPendentes || 0),
        custosPorCnpj,
        evolucaoMensal,
        distribuicaoCargos: Array.isArray(typedData?.distribuicaoCargos) ? typedData.distribuicaoCargos : [],
        planoPrincipal,
      };

      console.log('✅ [useEmpresaDashboardMetrics] Resultado final:', resultado);

      return resultado;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
