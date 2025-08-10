
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

export const useEmpresaPorCnpj = (cnpjId: string | undefined) => {
  return useQuery({
    queryKey: ['empresa-por-cnpj', cnpjId],
    queryFn: async () => {
      console.log(`🔍 [useEmpresaPorCnpj] Iniciando busca da empresa via CNPJ: ${cnpjId}`);
      
      if (!cnpjId) {
        console.error('❌ [useEmpresaPorCnpj] ID do CNPJ não fornecido');
        throw new Error('ID do CNPJ não fornecido');
      }

      console.log(`📡 [useEmpresaPorCnpj] Fazendo query no Supabase para CNPJ: ${cnpjId}`);
      
      const { data, error } = await supabase
        .from('cnpjs')
        .select(`
          *,
          empresas (
            id,
            nome,
            responsavel,
            email,
            telefone,
            created_at,
            updated_at,
            corretora_id,
            primeiro_acesso
          )
        `)
        .eq('id', cnpjId)
        .maybeSingle();

      console.log(`📊 [useEmpresaPorCnpj] Resultado da query:`, { data, error });

      if (error) {
        console.error('❌ [useEmpresaPorCnpj] Erro na query:', error);
        throw error;
      }
      
      if (!data || !data.empresas) {
        console.error('❌ [useEmpresaPorCnpj] CNPJ ou empresa não encontrada');
        return null;
      }

      console.log('✅ [useEmpresaPorCnpj] Empresa encontrada via CNPJ:', data.empresas.nome);
      return {
        cnpj: data,
        empresa: data.empresas
      };
    },
    enabled: !!cnpjId,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
};
