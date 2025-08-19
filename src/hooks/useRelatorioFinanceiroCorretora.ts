import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RelatorioFinanceiroItem {
  empresa_id: string;
  empresa_nome: string;
  total_cnpjs_ativos: number;
  total_funcionarios_segurados: number;
  custo_total_mensal: number;
}

export const useRelatorioFinanceiroCorretora = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['relatorio-financeiro-corretora', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('Chamando RPC get_empresas_com_metricas para relatório financeiro (sem parâmetro)');

      // Usar get_empresas_com_metricas sem parâmetro (já filtra por RLS)
      const { data, error } = await supabase.rpc('get_empresas_com_metricas');

      if (error) {
        console.error('Erro ao buscar relatório financeiro:', error);
        throw error;
      }

      console.log('Dados retornados da RPC get_empresas_com_metricas:', data);

      // A função get_empresas_com_metricas retorna um objeto de métricas agregadas
      // Preciso criar um array fictício com base nos dados agregados
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        // Se retornou objeto de métricas, criar um array com uma entrada consolidada
        const sanitizedData: RelatorioFinanceiroItem[] = [{
          empresa_id: 'consolidated',
          empresa_nome: 'Todas as Empresas',
          total_cnpjs_ativos: isNaN(Number(data.total_cnpjs)) ? 0 : Number(data.total_cnpjs),
          total_funcionarios_segurados: isNaN(Number(data.total_funcionarios)) ? 0 : Number(data.total_funcionarios),
          custo_total_mensal: isNaN(Number(data.receita_total)) ? 0 : Number(data.receita_total),
        }];

        console.log('Dados processados para relatório financeiro (objeto):', sanitizedData);
        return sanitizedData;
      }

      // Se for array (empresas individuais), processa normalmente
      const sanitizedData = Array.isArray(data) ? data.map((item: any) => ({
        empresa_id: String(item.id) || '',
        empresa_nome: String(item.nome) || '',
        total_cnpjs_ativos: isNaN(Number(item.total_cnpjs)) ? 0 : Number(item.total_cnpjs),
        total_funcionarios_segurados: isNaN(Number(item.total_funcionarios)) ? 0 : Number(item.total_funcionarios),
        custo_total_mensal: isNaN(Number(item.custo_mensal_total)) ? 0 : Number(item.custo_mensal_total),
      })) : [];

      console.log('Dados processados para relatório financeiro (array):', sanitizedData);
      return sanitizedData as RelatorioFinanceiroItem[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
