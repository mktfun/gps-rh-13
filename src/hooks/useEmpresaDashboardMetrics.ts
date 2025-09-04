import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { EmpresaDashboardData } from '@/types/supabase-json';

export const useEmpresaDashboardMetrics = (debugMode = false) => {
  const { user, empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-dashboard-metrics', empresaId || 'no-empresa'],
    queryFn: async () => {
      console.log('🔍 [EmpresaDashboardMetrics] Iniciando busca de métricas...');
      console.log('🔍 [EmpresaDashboardMetrics] User ID:', user?.id);
      console.log('🔍 [EmpresaDashboardMetrics] Empresa ID:', empresaId);

      if (!user?.id) {
        console.error('❌ [EmpresaDashboardMetrics] Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      let empresaIdToUse = empresaId;

      // Se não temos empresaId, buscar na tabela profiles
      if (!empresaIdToUse) {
        console.log('🔍 [EmpresaDashboardMetrics] Buscando empresa_id do perfil...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('empresa_id')
          .eq('id', user.id)
          .single();

        if (profileError || !profileData?.empresa_id) {
          console.error('❌ [EmpresaDashboardMetrics] Erro ao buscar empresa_id:', profileError);
          throw new Error('Empresa não encontrada no perfil do usuário');
        }

        empresaIdToUse = profileData.empresa_id;
        console.log('✅ [EmpresaDashboardMetrics] Empresa ID obtido do perfil:', empresaIdToUse);
      }

      console.log('🔍 [EmpresaDashboardMetrics] Buscando métricas para empresa:', empresaIdToUse);
      
      const { data: mainData, error: mainError } = await supabase.rpc(
        'get_empresa_dashboard_metrics', 
        { p_empresa_id: empresaIdToUse }
      );

      if (mainError) {
        console.error('❌ [EmpresaDashboardMetrics] Erro ao buscar métricas:', mainError);
        throw mainError;
      }

      if (!mainData) {
        console.warn('⚠️ [EmpresaDashboardMetrics] Nenhum dado retornado');
        return {
          totalCnpjs: 0,
          totalFuncionarios: 0,
          funcionariosAtivos: 0,
          funcionariosPendentes: 0,
          custoMensalTotal: 0,
          custosPorCnpj: [],
          evolucaoMensal: [],
          distribuicaoCargos: [],
          planoPrincipal: null
        };
      }

      console.log('✅ [EmpresaDashboardMetrics] Dados recebidos:', mainData);

      // CORREÇÃO: Parse correto da estrutura de dados retornada pelo SQL
      const typedData = mainData as any; // Cast para acessar propriedades
      const result = {
        totalCnpjs: Number(typedData.totalCnpjs) || 0,
        totalFuncionarios: Number(typedData.totalFuncionarios) || 0,
        funcionariosAtivos: Number(typedData.funcionariosAtivos) || 0,
        funcionariosPendentes: Number(typedData.funcionariosPendentes) || 0,
        custoMensalTotal: Number(typedData.custoMensalTotal) || 0,
        custosPorCnpj: typedData.custosPorCnpj || [],
        evolucaoMensal: typedData.evolucaoMensal || [],
        distribuicaoCargos: typedData.distribuicaoCargos || [],
        planoPrincipal: typedData.planoPrincipal,
        empresaId: empresaIdToUse
      };

      console.log('✅ [EmpresaDashboardMetrics] Dados processados:', result);
      return result;
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });
};