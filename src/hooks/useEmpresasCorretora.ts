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
          .rpc('get_empresas_unificadas', { p_corretora_id: user.id });

        if (!rpcError && empresasRpc) {
          console.log('✅ Empresas carregadas via RPC:', empresasRpc);
          return empresasRpc.map((empresa: any) => ({
            id: empresa.id,
            nome: empresa.nome,
            cnpj: empresa.cnpj || '',
            status: 'ativa' as const,
            created_at: empresa.created_at || new Date().toISOString(),
            updated_at: empresa.updated_at || new Date().toISOString(),
            total_funcionarios: Number(empresa.total_funcionarios) || 0,
            funcionarios_ativos: Number(empresa.funcionarios_ativos) || 0,
            funcionarios_pendentes: Number(empresa.funcionarios_pendentes) || 0,
            receita_mensal_estimada: Number(empresa.funcionarios_ativos || 0) * 450,
            ultimo_plano_ativo: undefined
          }));
        }

        // Fallback: buscar via query direta simples
        console.log('📊 Buscando empresas via query direta...');
        
        const { data: empresas, error: empresasError } = await supabase
          .from('empresas')
          .select('id, nome, created_at, updated_at')
          .eq('corretora_id', user.id)
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
            // Buscar CNPJs da empresa
            const { data: cnpjs } = await supabase
              .from('cnpjs')
              .select('id')
              .eq('empresa_id', empresa.id);

            const cnpjIds = cnpjs?.map(c => c.id) || [];

            // Buscar funcionários via CNPJs
            let funcionarios: any[] = [];
            if (cnpjIds.length > 0) {
              const { data: funcionariosData } = await supabase
                .from('funcionarios')
                .select('id, status')
                .in('cnpj_id', cnpjIds);
              
              funcionarios = funcionariosData || [];
            }

            const totalFuncionarios = funcionarios.length;
            const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
            const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente').length;

            return {
              id: empresa.id,
              nome: empresa.nome,
              cnpj: '',
              status: 'ativa' as const,
              created_at: empresa.created_at,
              updated_at: empresa.updated_at,
              total_funcionarios: totalFuncionarios,
              funcionarios_ativos: funcionariosAtivos,
              funcionarios_pendentes: funcionariosPendentes,
              receita_mensal_estimada: funcionariosAtivos * 450,
              ultimo_plano_ativo: undefined
            };
          })
        );

        console.log('✅ Empresas carregadas com métricas:', empresasComMetricas);
        return empresasComMetricas;

      } catch (error) {
        console.error('❌ Erro ao buscar empresas da corretora:', error);
        // Retornar array vazio em caso de erro para não quebrar o build
        return [];
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 3, // Cache por 3 minutos
    refetchInterval: 1000 * 60 * 10, // Refetch a cada 10 minutos
    retry: 2,
    retryDelay: 1000,
  });
};