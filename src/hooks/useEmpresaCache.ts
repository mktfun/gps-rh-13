
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

export const useEmpresaCache = () => {
  const queryClient = useQueryClient();

  const clearEmpresaCache = (empresaId?: string) => {
    if (empresaId) {
      logger.info(`🗑️ [useEmpresaCache] Limpando cache específico da empresa: ${empresaId}`);
      queryClient.invalidateQueries({ queryKey: ['empresa', empresaId] });
      queryClient.removeQueries({ queryKey: ['empresa', empresaId] });
    } else {
      logger.info('🗑️ [useEmpresaCache] Limpando todo o cache de empresas');
      queryClient.invalidateQueries({ queryKey: ['empresa'] });
      queryClient.removeQueries({ queryKey: ['empresa'] });
    }
  };

  const refreshEmpresa = async (empresaId: string) => {
    logger.info(`🔄 [useEmpresaCache] Forçando refresh da empresa: ${empresaId}`);
    await queryClient.refetchQueries({ queryKey: ['empresa', empresaId] });
  };

  return {
    clearEmpresaCache,
    refreshEmpresa,
  };
};
