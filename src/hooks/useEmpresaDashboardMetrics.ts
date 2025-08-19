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
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    razao_social: string;
  } | null;
}

export const useEmpresaDashboardMetrics = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', empresaId, 'v3'], // Versão v3 - função revertida
    queryFn: async (): Promise<EmpresaDashboardMetrics> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      console.log('🔍 [useEmpresaDashboardMetrics] Chamando função com empresa ID:', empresaId);

      // CORREÇÃO: Chamando a função com apenas o parâmetro empresaId
      const { data: dashboardData, error: dashboardError } = await supabase.rpc(
        'get_empresa_dashboard_metrics',
        { 
          p_empresa_id: empresaId
        }
      );

      if (dashboardError) {
        console.error('❌ [useEmpresaDashboardMetrics] Erro ao chamar função:', dashboardError);
        throw dashboardError;
      }

      if (!dashboardData) {
        console.error('❌ [useEmpresaDashboardMetrics] Dados nulos retornados');
        throw new Error('Nenhum dado retornado da função');
      }

      console.log('📊 [useEmpresaDashboardMetrics] Dados brutos da SQL:', dashboardData);

      // Processar dados com segurança
      const typedData = dashboardData as any;

      const resultado = {
        custoMensalTotal: Number(typedData?.custoMensalTotal || 0),
        totalCnpjs: Number(typedData?.totalCnpjs || 0),
        totalFuncionarios: Number(typedData?.totalFuncionarios || 0),
        funcionariosAtivos: Number(typedData?.funcionariosAtivos || 0),
        funcionariosPendentes: Number(typedData?.funcionariosPendentes || 0),
        custosPorCnpj: Array.isArray(typedData?.custosPorCnpj) 
          ? typedData.custosPorCnpj.map((item: any) => ({
              cnpj: String(item.cnpj || ''),
              razao_social: String(item.razao_social || ''),
              valor_mensal: Number(item.valor_mensal || 0),
              funcionarios_count: Number(item.funcionarios_count || 0)
            }))
          : [],
        evolucaoMensal: Array.isArray(typedData?.evolucaoMensal) 
          ? typedData.evolucaoMensal.map((item: any) => ({
              mes: String(item.mes || ''),
              funcionarios: Number(item.funcionarios || 0),
              custo: Number(item.custo || 0)
            }))
          : [],
        distribuicaoCargos: Array.isArray(typedData?.distribuicaoCargos) 
          ? typedData.distribuicaoCargos.map((item: any) => ({
              cargo: String(item.cargo || ''),
              count: Number(item.count || 0)
            }))
          : [],
        planoPrincipal: typedData?.planoPrincipal ? {
          seguradora: String(typedData.planoPrincipal.seguradora || ''),
          valor_mensal: Number(typedData.planoPrincipal.valor_mensal || 0),
          cobertura_morte: Number(typedData.planoPrincipal.cobertura_morte || 0),
          cobertura_morte_acidental: Number(typedData.planoPrincipal.cobertura_morte_acidental || 0),
          cobertura_invalidez_acidente: Number(typedData.planoPrincipal.cobertura_invalidez_acidente || 0),
          razao_social: String(typedData.planoPrincipal.razao_social || ''),
        } : null,
      };

      console.log('✅ [useEmpresaDashboardMetrics] Resultado final processado:', resultado);

      return resultado;
    },
    enabled: !!empresaId,
    staleTime: 0, // Desabilitar cache temporariamente para teste
    gcTime: 1000 * 60 * 1, // 1 minuto
    refetchOnWindowFocus: true, // Recarregar ao focar na janela
  });
};
