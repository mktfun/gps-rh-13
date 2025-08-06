
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface EvolucaoMensalData {
  mes: string;
  funcionarios: number;
  custo: number;
}

export const useEmpresaEvolucaoMensal = () => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['empresa-evolucao-mensal-completa', empresaId],
    queryFn: async (): Promise<EvolucaoMensalData[]> => {
      console.log('🔍 Buscando evolução mensal completa da empresa...');

      if (!empresaId) {
        console.error('❌ Empresa ID não encontrado');
        throw new Error('Empresa ID não encontrado');
      }

      const { data, error } = await supabase.rpc('get_empresa_evolucao_mensal_completa', {
        p_empresa_id: empresaId
      });

      if (error) {
        console.error('❌ Erro ao buscar evolução mensal completa:', error);
        throw new Error(`Erro ao buscar evolução mensal: ${error.message}`);
      }

      console.log('✅ Evolução mensal completa carregada:', data);

      return data || [];
    },
    enabled: !!empresaId,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false,
  });
};
