
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ActionItem {
  empresa_id: string;
  empresa_nome: string;
  count: number;
  tipo: 'pendencias_exclusao' | 'novos_funcionarios' | 'configuracao_pendente';
}

interface ActionsDetailedData {
  pendencias_exclusao: ActionItem[];
  novos_funcionarios: ActionItem[];
  configuracao_pendente: ActionItem[];
}

export const useCorretoraDashboardActionsDetailed = () => {
  return useQuery({
    queryKey: ['corretora-dashboard-actions-detailed'],
    queryFn: async (): Promise<ActionsDetailedData> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Pendências de exclusão por empresa
      const { data: pendenciasExclusao, error: errorPendencias } = await supabase
        .from('funcionarios')
        .select(`
          cnpj:cnpjs!inner(
            empresa_id,
            empresas!inner(nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id)
        .eq('status', 'exclusao_solicitada');

      if (errorPendencias) throw errorPendencias;

      // Novos funcionários por empresa
      const { data: novosFuncionarios, error: errorNovos } = await supabase
        .from('funcionarios')
        .select(`
          cnpj:cnpjs!inner(
            empresa_id,
            empresas!inner(nome)
          )
        `)
        .eq('cnpjs.empresas.corretora_id', user.id)
        .eq('status', 'pendente');

      if (errorNovos) throw errorNovos;

      // Configuração pendente por empresa
      const { data: configuracaoPendente, error: errorConfiguracao } = await supabase
        .from('cnpjs')
        .select(`
          empresa_id,
          empresas!inner(nome)
        `)
        .eq('empresas.corretora_id', user.id)
        .eq('status', 'configuracao');

      if (errorConfiguracao) throw errorConfiguracao;

      // Agrupar por empresa
      const groupByEmpresa = (data: any[], tipo: ActionItem['tipo']): ActionItem[] => {
        const grouped = data.reduce((acc, item) => {
          const empresaId = item.cnpj?.empresa_id || item.empresa_id;
          const empresaNome = item.cnpj?.empresas?.nome || item.empresas?.nome;
          
          if (!acc[empresaId]) {
            acc[empresaId] = {
              empresa_id: empresaId,
              empresa_nome: empresaNome,
              count: 0,
              tipo
            };
          }
          acc[empresaId].count++;
          return acc;
        }, {} as Record<string, ActionItem>);

        return Object.values(grouped);
      };

      return {
        pendencias_exclusao: groupByEmpresa(pendenciasExclusao || [], 'pendencias_exclusao'),
        novos_funcionarios: groupByEmpresa(novosFuncionarios || [], 'novos_funcionarios'),
        configuracao_pendente: groupByEmpresa(configuracaoPendente || [], 'configuracao_pendente')
      };
    }
  });
};
