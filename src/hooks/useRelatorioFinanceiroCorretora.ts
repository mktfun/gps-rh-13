
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

      console.log('Chamando RPC get_relatorio_financeiro_corretora com user.id:', user.id);

      // Using any type for the RPC call since the function isn't in the generated types yet
      const { data, error } = await (supabase as any).rpc('get_relatorio_financeiro_corretora', {
        p_corretora_id: user.id
      });

      if (error) {
        console.error('Erro ao buscar relatório financeiro:', error);
        throw error;
      }

      console.log('Dados retornados da RPC:', data);

      // Validate and sanitize the data to prevent NaN values
      const sanitizedData = Array.isArray(data) ? data.map((item: any) => ({
        empresa_id: String(item.empresa_id) || '',
        empresa_nome: String(item.empresa_nome) || '',
        total_cnpjs_ativos: isNaN(Number(item.total_cnpjs_ativos)) ? 0 : Number(item.total_cnpjs_ativos),
        total_funcionarios_segurados: isNaN(Number(item.total_funcionarios_segurados)) ? 0 : Number(item.total_funcionarios_segurados),
        custo_total_mensal: isNaN(Number(item.custo_total_mensal)) ? 0 : Number(item.custo_total_mensal),
      })) : [];

      return sanitizedData as RelatorioFinanceiroItem[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });
};
