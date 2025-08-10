
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

export const useEmpresa = (empresaId: string | undefined) => {
  return useQuery({
    queryKey: ['empresa', empresaId],
    queryFn: async () => {
      console.log(`🔍 [useEmpresa] Iniciando busca da empresa: ${empresaId}`);
      
      if (!empresaId) {
        console.error('❌ [useEmpresa] ID da empresa não fornecido');
        throw new Error('ID da empresa não fornecido');
      }

      console.log(`📡 [useEmpresa] Fazendo query no Supabase para empresa: ${empresaId}`);
      
      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .maybeSingle();

      console.log(`📊 [useEmpresa] Resultado da query:`, { data, error });

      if (error) {
        console.error('❌ [useEmpresa] Erro na query:', error);
        throw error;
      }
      
      if (!data) {
        console.error('❌ [useEmpresa] Nenhum dado retornado (empresa não encontrada)');
        return null;
      }

      console.log('✅ [useEmpresa] Empresa encontrada com sucesso:', data.nome);
      return data;
    },
    enabled: !!empresaId,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};

// Hook utilitário para invalidar o cache da empresa (uso manual apenas)
export const useInvalidateEmpresa = () => {
  const queryClient = useQueryClient();
  
  return (empresaId: string) => {
    console.log(`🗑️ [useInvalidateEmpresa] Invalidando cache da empresa: ${empresaId}`);
    queryClient.invalidateQueries({ queryKey: ['empresa', empresaId] });
    queryClient.removeQueries({ queryKey: ['empresa', empresaId] });
  };
};
