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

      // Transformar dados de get_empresas_com_metricas para o formato do relatório financeiro
      const sanitizedData = Array.isArray(data) ? data.map((item: any) => ({
        empresa_id: String(item.id) || '',
        empresa_nome: String(item.nome) || '',
        total_cnpjs_ativos: isNaN(Number(item.total_cnpjs)) ? 0 : Number(item.total_cnpjs),
        total_funcionarios_segurados: isNaN(Number(item.total_funcionarios)) ? 0 : Number(item.total_funcionarios),
        custo_total_mensal: isNaN(Number(item.custo_mensal_total)) ? 0 : Number(item.custo_mensal_total),
      })) : [];

      console.log('Dados processados para relatório financeiro:', sanitizedData);

      return sanitizedData as RelatorioFinanceiroItem[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
