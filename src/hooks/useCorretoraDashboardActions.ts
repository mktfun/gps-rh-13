
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardActions {
  pendenciasExclusao: number;
  funcionariosPendentes: number;
  empresasConfiguracaoPendente: number;
  ultimasPendenciasExclusao: Array<{
    id: string;
    nome: string;
    empresa_nome: string;
    empresa_id: string;
    data_solicitacao: string;
  }>;
  ultimosFuncionariosPendentes: Array<{
    id: string;
    nome: string;
    empresa_nome: string;
    empresa_id: string;
    data_criacao: string;
  }>;
}

export const useCorretoraDashboardActions = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['corretoraDashboardActions', user?.id],
    queryFn: async (): Promise<DashboardActions> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Buscando ações necessárias via RPC para corretora:', user.id);

      // Buscar contadores via RPC
      const { data: acoesData, error: acoesError } = await supabase.rpc('get_acoes_necessarias_corretora');

      if (acoesError) {
        console.error('Erro ao buscar ações necessárias via RPC:', acoesError);
        throw new Error('Não foi possível carregar as ações necessárias.');
      }

      console.log('Ações necessárias carregadas via RPC:', acoesData);

      // Buscar últimas pendências de exclusão (detalhadas)
      const { data: ultimasPendenciasExclusao, error: pendenciasError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          data_solicitacao_exclusao,
          cnpjs!inner(
            empresas!inner(id, nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id as any)
        .eq('status', 'exclusao_solicitada' as any)
        .order('data_solicitacao_exclusao', { ascending: false })
        .limit(5);

      // Buscar últimos funcionários pendentes (detalhadas)
      const { data: ultimosFuncionariosPendentes, error: funcionariosError } = await supabase
        .from('funcionarios')
        .select(`
          id,
          nome,
          created_at,
          cnpjs!inner(
            empresas!inner(id, nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id as any)
        .eq('status', 'pendente' as any)
        .order('created_at', { ascending: false })
        .limit(5);

      // Verificar se as queries retornaram erro
      if (pendenciasError) {
        console.error('Erro ao buscar pendências de exclusão:', pendenciasError);
      }

      if (funcionariosError) {
        console.error('Erro ao buscar funcionários pendentes:', funcionariosError);
      }

      // Função auxiliar para verificar se o item não é um erro
      const isValidData = (item: any): boolean => {
        return item && typeof item === 'object' && 'id' in item;
      };

      return {
        pendenciasExclusao: (acoesData as any)?.pendencias_exclusao || 0,
        funcionariosPendentes: (acoesData as any)?.novos_funcionarios || 0,
        empresasConfiguracaoPendente: (acoesData as any)?.configuracao_pendente || 0,
        ultimasPendenciasExclusao: ultimasPendenciasExclusao?.filter(isValidData).map(item => ({
          id: item.id,
          nome: item.nome,
          empresa_nome: (item.cnpjs as any).empresas.nome,
          empresa_id: (item.cnpjs as any).empresas.id,
          data_solicitacao: item.data_solicitacao_exclusao || ''
        })) || [],
        ultimosFuncionariosPendentes: ultimosFuncionariosPendentes?.filter(isValidData).map(item => ({
          id: item.id,
          nome: item.nome,
          empresa_nome: (item.cnpjs as any).empresas.nome,
          empresa_id: (item.cnpjs as any).empresas.id,
          data_criacao: item.created_at
        })) || []
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2, // Cache por 2 minutos
    refetchOnWindowFocus: true
  });
};
