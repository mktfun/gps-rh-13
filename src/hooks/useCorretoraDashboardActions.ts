
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

      // Contadores via RPC já unificados para pendencias
      const { data: acoesData, error: acoesError } = await supabase.rpc('get_acoes_necessarias_corretora');

      if (acoesError) {
        console.error('Erro ao buscar ações necessárias via RPC:', acoesError);
        throw new Error('Não foi possível carregar as ações necessárias.');
      }

      console.log('Ações necessárias carregadas via RPC:', acoesData);

      // Últimas pendências de exclusão (pendencias: tipo = 'cancelamento')
      const { data: ultimasPendenciasExclusao, error: pendenciasError } = await supabase
        .from('pendencias')
        .select(`
          id,
          data_criacao,
          funcionarios!left(
            id,
            nome
          ),
          cnpjs!inner(
            empresas!inner(id, nome)
          )
        `)
        .eq('corretora_id', user.id as any)
        .eq('status', 'pendente' as any)
        .eq('tipo', 'cancelamento' as any)
        .order('data_criacao', { ascending: false })
        .limit(5);

      // Últimas pendências de ativação (pendencias: tipo = 'ativacao')
      const { data: ultimosFuncionariosPendentes, error: funcionariosError } = await supabase
        .from('pendencias')
        .select(`
          id,
          data_criacao,
          funcionarios!left(
            id,
            nome
          ),
          cnpjs!inner(
            empresas!inner(id, nome)
          )
        `)
        .eq('corretora_id', user.id as any)
        .eq('status', 'pendente' as any)
        .eq('tipo', 'ativacao' as any)
        .order('data_criacao', { ascending: false })
        .limit(5);

      if (pendenciasError) {
        console.error('Erro ao buscar pendências de exclusão:', pendenciasError);
      }

      if (funcionariosError) {
        console.error('Erro ao buscar pendências de ativação:', funcionariosError);
      }

      const isValidData = (item: any): boolean => {
        return item && typeof item === 'object' && 'id' in item;
      };

      return {
        pendenciasExclusao: (acoesData as any)?.pendencias_exclusao || 0,
        funcionariosPendentes: (acoesData as any)?.novos_funcionarios || 0,
        empresasConfiguracaoPendente: (acoesData as any)?.configuracao_pendente || 0,
        ultimasPendenciasExclusao: (ultimasPendenciasExclusao || []).filter(isValidData).map((item: any) => ({
          id: item.id,
          nome: (item.funcionarios as any)?.nome || '—',
          empresa_nome: (item.cnpjs as any).empresas.nome,
          empresa_id: (item.cnpjs as any).empresas.id,
          data_solicitacao: item.data_criacao || ''
        })),
        ultimosFuncionariosPendentes: (ultimosFuncionariosPendentes || []).filter(isValidData).map((item: any) => ({
          id: item.id,
          nome: (item.funcionarios as any)?.nome || '—',
          empresa_nome: (item.cnpjs as any).empresas.nome,
          empresa_id: (item.cnpjs as any).empresas.id,
          data_criacao: item.data_criacao || ''
        }))
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true
  });
};
