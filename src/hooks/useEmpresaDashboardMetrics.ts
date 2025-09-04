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
      
      const { data, error } = await supabase.rpc(
        'get_empresa_dashboard_metrics', 
        { p_empresa_id: empresaIdToUse }
      );

      if (error) {
        console.error('❌ [EmpresaDashboardMetrics] Erro ao buscar métricas:', error);
        throw error;
      }

      if (!data) {
        console.warn('⚠️ [EmpresaDashboardMetrics] Nenhum dado retornado');
        return {
          totalCnpjs: 0,
          totalFuncionarios: 0,
          funcionariosAtivos: 0,
          funcionariosPendentes: 0,
          custoMensalTotal: 0,
          distribuicaoCargos: [],
          evolucaoMensal: [],
          custosPorCnpj: [],
          planoPrincipal: null,
          empresaId: empresaIdToUse
        };
      }

      console.log('✅ [EmpresaDashboardMetrics] Dados recebidos:', data);

      // MAPEAMENTO CORRETO AQUI, SEU ANIMAL
      const typedData = data as any; // Cast para acessar propriedades
      const mappedData = {
        totalCnpjs: Number(typedData.total_cnpjs) || 0,
        totalFuncionarios: Number(typedData.total_funcionarios) || 0,
        funcionariosAtivos: Number(typedData.funcionarios_ativos) || 0,
        funcionariosPendentes: Number(typedData.funcionarios_pendentes) || 0,
        custoMensalTotal: Number(typedData.custo_mensal_total) || 0,
        distribuicaoCargos: typedData.distribuicao_cargos || [],
        evolucaoMensal: typedData.evolucao_mensal || [],
        custosPorCnpj: [], // Será implementado depois se necessário
        planoPrincipal: null, // Será implementado depois se necessário
        empresaId: empresaIdToUse
      };

      console.log('✅ [EmpresaDashboardMetrics] Dados mapeados para camelCase:', mappedData);
      return mappedData;
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });
};