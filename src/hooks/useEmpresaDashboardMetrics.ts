
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface CustoPorCnpj {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_count: number;
}

interface EvolucaoMensal {
  mes: string;
  funcionarios: number;
  custo: number;
}

interface DistribuicaoCargo {
  cargo: string;
  count: number;
}

interface PlanoPrincipal {
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_invalidez: number;
  razao_social: string;
}

export interface EmpresaDashboardMetrics {
  totalCnpjs: number;
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosPendentes: number;
  custoMensalTotal: number;
  custosPorCnpj: CustoPorCnpj[];
  evolucaoMensal: EvolucaoMensal[];
  distribuicaoCargos: DistribuicaoCargo[];
  planoPrincipal?: PlanoPrincipal;
}

export const useEmpresaDashboardMetrics = () => {
  const { data: empresaId, isLoading: isLoadingEmpresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', empresaId],
    queryFn: async (): Promise<EmpresaDashboardMetrics> => {
      console.log('🔍 Iniciando busca de métricas do dashboard da empresa:', empresaId);

      if (!empresaId) {
        console.error('❌ Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      // Uma única chamada RPC para buscar todas as métricas
      const { data, error } = await supabase.rpc('get_empresa_dashboard_metrics' as any, {
        p_empresa_id: empresaId
      });

      if (error) {
        console.error('❌ Erro ao buscar métricas do dashboard:', error);
        throw new Error(`Erro ao buscar métricas: ${error.message}`);
      }

      if (!data) {
        console.error('❌ Nenhum dado retornado pela função RPC');
        throw new Error('Nenhum dado retornado');
      }

      console.log('✅ Métricas do dashboard carregadas com sucesso:', data);

      // Os dados já vêm processados e formatados do backend com validação contra NaN
      const result = data as any;
      return {
        totalCnpjs: isNaN(Number(result.totalCnpjs)) ? 0 : Number(result.totalCnpjs),
        totalFuncionarios: isNaN(Number(result.totalFuncionarios)) ? 0 : Number(result.totalFuncionarios),
        funcionariosAtivos: isNaN(Number(result.funcionariosAtivos)) ? 0 : Number(result.funcionariosAtivos),
        funcionariosPendentes: isNaN(Number(result.funcionariosPendentes)) ? 0 : Number(result.funcionariosPendentes),
        custoMensalTotal: isNaN(Number(result.custoMensalTotal)) ? 0 : Number(result.custoMensalTotal),
        custosPorCnpj: Array.isArray(result.custosPorCnpj) ? result.custosPorCnpj.map((item: any) => ({
          ...item,
          valor_mensal: isNaN(Number(item.valor_mensal)) ? 0 : Number(item.valor_mensal),
          funcionarios_count: isNaN(Number(item.funcionarios_count)) ? 0 : Number(item.funcionarios_count)
        })) : [],
        evolucaoMensal: Array.isArray(result.evolucaoMensal) ? result.evolucaoMensal.map((item: any) => ({
          ...item,
          funcionarios: isNaN(Number(item.funcionarios)) ? 0 : Number(item.funcionarios),
          custo: isNaN(Number(item.custo)) ? 0 : Number(item.custo)
        })) : [],
        distribuicaoCargos: result.distribuicaoCargos || [],
        planoPrincipal: result.planoPrincipal ? {
          ...result.planoPrincipal,
          valor_mensal: isNaN(Number(result.planoPrincipal.valor_mensal)) ? 0 : Number(result.planoPrincipal.valor_mensal),
          cobertura_morte: isNaN(Number(result.planoPrincipal.cobertura_morte)) ? 0 : Number(result.planoPrincipal.cobertura_morte),
          cobertura_invalidez: isNaN(Number(result.planoPrincipal.cobertura_invalidez)) ? 0 : Number(result.planoPrincipal.cobertura_invalidez)
        } : undefined
      };
    },
    enabled: !!empresaId && !isLoadingEmpresaId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
