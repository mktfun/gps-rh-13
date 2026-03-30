
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useSignedUrl = () => {
  const [loading, setLoading] = useState(false);

  const getSignedUrl = useCallback(async (filePath: string, expiresIn: number = 3600) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('anexos_chat')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        logger.error('❌ Erro ao gerar URL assinada:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      logger.error('❌ Erro ao gerar URL assinada:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (filePath: string) => {
    try {
      const signedUrl = await getSignedUrl(filePath, 60); // 60 segundos para download
      window.open(signedUrl, '_blank');
    } catch (error) {
      logger.error('❌ Erro ao baixar arquivo:', error);
    }
  }, [getSignedUrl]);

  return {
    getSignedUrl,
    downloadFile,
    loading
  };
};
