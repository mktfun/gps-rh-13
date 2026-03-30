
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { createGetPendenciasEmpresaFunction, testGetPendenciasEmpresaFunction } from '@/utils/createMissingFunction';
import { logger } from '@/lib/logger';

export interface PendenciaEmpresa {
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
  prioridade: number;
  corretora_id: string;
  tipo_plano: string | null;
}

export const usePendenciasEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['pendencias-empresa', empresaId],
    queryFn: async (): Promise<PendenciaEmpresa[]> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      logger.info('🔍 Buscando pendências da empresa:', empresaId);

      const { data, error } = await supabase.rpc('get_pendencias_empresa' as any, {
        p_empresa_id: empresaId
      });

      if (error) {
        // Check if error is due to missing function (404 or function not found)
        if (error.message.includes('404') || error.message.includes('function') || error.code === '42883') {
          logger.info('⚠️ Função get_pendencias_empresa não encontrada, tentando criar...');

          const createResult = await createGetPendenciasEmpresaFunction();

          if (createResult.success) {
            logger.info('✅ Função criada com sucesso, tentando novamente...');

            // Try the query again after creating the function
            const { data: retryData, error: retryError } = await supabase.rpc('get_pendencias_empresa' as any, {
              p_empresa_id: empresaId
            });

            if (retryError) {
              logger.error('❌ Erro mesmo após criar a função:', retryError);
              throw retryError;
            }

            logger.info('✅ Pendências encontradas após criar função:', Array.isArray(retryData) ? retryData.length : 0);
            return Array.isArray(retryData) ? retryData : [];
          } else {
            logger.error('❌ Não foi possível criar a função:', createResult.message);
            // Return empty array instead of throwing error to avoid breaking the UI
            return [];
          }
        } else {
          logger.error('❌ Erro ao buscar pendências da empresa:', error);
          throw error;
        }
      }

      logger.info('✅ Pendências encontradas:', Array.isArray(data) ? data.length : 0);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
