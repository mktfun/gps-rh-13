
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface TopEmpresaData {
  id: string;
  nome: string;
  receita_mensal: number;
  funcionarios_ativos: number;
  pendencias: number;
}

export const useTopEmpresasReceita = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['top-empresas-receita', user?.id],
    queryFn: async (): Promise<TopEmpresaData[]> => {
      if (!user?.id) {
        throw new Error('Usuário não autenticado');
      }

      console.log('🔍 Buscando top empresas por receita...');

      const { data, error } = await supabase.rpc('get_top_empresas_receita');

      if (error) {
        console.error('❌ Erro ao buscar top empresas:', error);
        throw error;
      }

      console.log('✅ Dados retornados pela RPC:', data);

      // A função RPC agora retorna um array JSON diretamente
      if (!data || !Array.isArray(data)) {
        console.warn('⚠️ Dados não são um array válido:', data);
        return [];
      }

      // Processar e validar os dados com proteção contra NaN
      const processedData = data.map((item: any) => ({
        id: String(item.id) || '',
        nome: String(item.nome) || '',
        receita_mensal: isNaN(Number(item.receita_mensal)) ? 0 : Number(item.receita_mensal),
        funcionarios_ativos: isNaN(Number(item.funcionarios_ativos)) ? 0 : Number(item.funcionarios_ativos),
        pendencias: isNaN(Number(item.pendencias)) ? 0 : Number(item.pendencias),
      }));

      console.log('✅ Dados processados:', processedData);
      return processedData;
    },
    enabled: !!user?.id,
    refetchInterval: 60000, // Auto-refresh a cada 1 minuto
    staleTime: 30000,
  });
};
