
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EvolucaoMensal {
  mes: string;
  novos_funcionarios: number;
}

export const useEmpresaEvolucao = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-evolucao-mensal', user?.id],
    queryFn: async (): Promise<EvolucaoMensal[]> => {
      console.log('🔍 Buscando evolução mensal da empresa...');

      if (!user?.id) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_empresa_evolucao_mensal');

      if (error) {
        console.error('❌ Erro ao buscar evolução mensal:', error);
        throw new Error(`Erro ao buscar evolução mensal: ${error.message}`);
      }

      console.log('✅ Evolução mensal carregada:', data);

      return data || [];
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
