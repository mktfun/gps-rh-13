import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { createGetPendenciasEmpresaFunction, testGetPendenciasEmpresaFunction } from '@/utils/createMissingFunction';

interface PendenciaEmpresa {
  id: string;
  protocolo: string;
  tipo: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  cnpj: string;
  razao_social: string;
  descricao: string;
  data_criacao: string;
  data_vencimento: string;
  status: string;
  dias_em_aberto: number;
  comentarios_count: number;
}

export const usePendenciasEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['pendencias-empresa', empresaId],
    queryFn: async (): Promise<PendenciaEmpresa[]> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      console.log('🔍 Buscando pendências da empresa:', empresaId);

      const { data, error } = await supabase.rpc('get_pendencias_empresa', {
        p_empresa_id: empresaId
      });

      if (error) {
        // Check if error is due to missing function (404 or function not found)
        if (error.message.includes('404') || error.message.includes('function') || error.code === '42883') {
          console.log('⚠️ Função get_pendencias_empresa não encontrada, tentando criar...');

          const createResult = await createGetPendenciasEmpresaFunction();

          if (createResult.success) {
            console.log('✅ Função criada com sucesso, tentando novamente...');

            // Try the query again after creating the function
            const { data: retryData, error: retryError } = await supabase.rpc('get_pendencias_empresa', {
              p_empresa_id: empresaId
            });

            if (retryError) {
              console.error('❌ Erro mesmo após criar a função:', retryError);
              throw retryError;
            }

            console.log('✅ Pendências encontradas após criar função:', retryData?.length || 0);
            return retryData || [];
          } else {
            console.error('❌ Não foi possível criar a função:', createResult.message);
            // Return empty array instead of throwing error to avoid breaking the UI
            return [];
          }
        } else {
          console.error('❌ Erro ao buscar pendências da empresa:', error);
          throw error;
        }
      }

      console.log('✅ Pendências encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
