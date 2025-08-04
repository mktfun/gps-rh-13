
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StatusDistribution {
  status: string;
  count: number;
}

export const useDistribuicaoStatus = () => {
  const fetchDistribuicaoStatus = async (): Promise<StatusDistribution[]> => {
    // Use type assertion to bypass TypeScript's strict typing for the RPC function name
    const { data, error } = await supabase.rpc('get_distribuicao_status_funcionarios' as any);

    if (error) {
      console.error('Erro ao buscar dados de distribuição de status:', error);
      throw new Error('Não foi possível carregar os dados do gráfico.');
    }

    // Safely cast and validate the data
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Transform the data to ensure it matches our interface
    return data.map((item: any) => ({
      status: String(item.status || ''),
      count: Number(item.count || 0)
    }));
  };

  return useQuery({
    queryKey: ['distribuicaoStatusFuncionarios'],
    queryFn: fetchDistribuicaoStatus,
  });
};
