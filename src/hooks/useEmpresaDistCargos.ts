
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DistribuicaoCargo {
  cargo: string;
  count: number;
}

export const useEmpresaDistCargos = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-distribuicao-cargos', user?.id],
    queryFn: async (): Promise<DistribuicaoCargo[]> => {
      console.log('🔍 Buscando distribuição de cargos da empresa...');

      if (!user?.id) {
        console.error('❌ Usuário não autenticado');
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase.rpc('get_empresa_distribuicao_cargos');

      if (error) {
        console.error('❌ Erro ao buscar distribuição de cargos:', error);
        throw new Error(`Erro ao buscar distribuição de cargos: ${error.message}`);
      }

      console.log('✅ Distribuição de cargos carregada:', data);

      return data || [];
    },
    enabled: !!user?.id,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
