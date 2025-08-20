import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EmpresaCorretora {
  id: string;
  nome: string;
  cnpj: string;
  status: 'ativa' | 'inativa' | 'pendente';
  created_at: string;
  updated_at: string;
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  receita_mensal_estimada: number;
  ultimo_plano_ativo?: {
    id: string;
    tipo: string;
    status: string;
  };
}

export const useEmpresasCorretora = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresas-corretora', user?.id],
    queryFn: async (): Promise<EmpresaCorretora[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Buscando empresas da corretora...');

      try {
        // Primeiro, tentar a função RPC se existir
        const { data: empresasRpc, error: rpcError } = await supabase
          .rpc('get_empresas_com_metricas');

        if (!rpcError && empresasRpc) {
          console.log('✅ Empresas carregadas via RPC:', empresasRpc);
          return empresasRpc.map((empresa: any) => ({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj || '',
            status: empresa.status || 'ativa',
            created_at: empresa.created_at,
            updated_at: empresa.updated_at,
            total_funcionarios: Number(empresa.total_funcionarios) || 0,
            funcionarios_ativos: Number(empresa.funcionarios_ativos) || 0,
            funcionarios_pendentes: Number(empresa.funcionarios_pendentes) || 0,
            receita_mensal_estimada: Number(empresa.receita_mensal_estimada) || 0,
            ultimo_plano_ativo: empresa.ultimo_plano_ativo
          }));
        }

        // Fallback: buscar via query direta
        console.log('📊 Buscando empresas via query direta...');
        
        const { data: empresas, error: empresasError } = await supabase
          .from('empresas')
          .select(`
            id,
            nome,
            cnpj,
            status,
            created_at,
            updated_at
          `)
          .order('created_at', { ascending: false });

        if (empresasError) {
          console.error('❌ Erro ao buscar empresas:', empresasError);
          throw empresasError;
        }

        if (!empresas || empresas.length === 0) {
          console.log('📋 Nenhuma empresa encontrada');
          return [];
        }

        // Para cada empresa, buscar métricas de funcionários
        const empresasComMetricas = await Promise.all(
          empresas.map(async (empresa) => {
            // Buscar funcionários da empresa
            const { data: funcionarios, error: funcError } = await supabase
              .from('funcionarios')
              .select('id, status')
              .eq('empresa_id', empresa.id);

            if (funcError) {
              console.warn(`⚠️ Erro ao buscar funcionários da empresa ${empresa.nome}:`, funcError);
            }

            const totalFuncionarios = funcionarios?.length || 0;
            const funcionariosAtivos = funcionarios?.filter(f => f.status === 'ativo').length || 0;
            const funcionariosPendentes = funcionarios?.filter(f => f.status === 'pendente').length || 0;

            // Buscar último plano ativo
            const { data: planos, error: planosError } = await supabase
              .from('planos_funcionarios')
              .select(`
                id,
                tipo,
                status
              `)
              .eq('empresa_id', empresa.id)
              .eq('status', 'ativo')
              .order('created_at', { ascending: false })
              .limit(1);

            if (planosError) {
              console.warn(`⚠️ Erro ao buscar planos da empresa ${empresa.nome}:`, planosError);
            }

            return {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: empresa.cnpj || '',
              status: empresa.status as 'ativa' | 'inativa' | 'pendente' || 'ativa',
              created_at: empresa.created_at,
              updated_at: empresa.updated_at,
              total_funcionarios: totalFuncionarios,
              funcionarios_ativos: funcionariosAtivos,
              funcionarios_pendentes: funcionariosPendentes,
              receita_mensal_estimada: funcionariosAtivos * 450, // Estimativa: R$ 450 por funcionário ativo
              ultimo_plano_ativo: planos && planos.length > 0 ? {
                id: planos[0].id,
                tipo: planos[0].tipo,
                status: planos[0].status
              } : undefined
            };
          })
        );

        console.log('✅ Empresas carregadas com métricas:', empresasComMetricas);
        return empresasComMetricas;

      } catch (error) {
        console.error('❌ Erro ao buscar empresas da corretora:', error);
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3, // Cache por 3 minutos
    refetchInterval: 1000 * 60 * 10, // Refetch a cada 10 minutos
    retry: 2,
    retryDelay: 1000,
  });
};
