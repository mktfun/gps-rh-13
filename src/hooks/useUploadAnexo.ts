
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnviarMensagem } from './useEnviarMensagem';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

// Função para sanitizar nomes de arquivo
const sanitizeFileName = (name: string) => {
  // Substitui espaços por underscores e remove qualquer coisa que não seja
  // letra, número, ponto, underscore ou hífen. Simples e brutal.
  return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
};

export const useUploadAnexo = (conversaId: string) => {
  const enviarMensagem = useEnviarMensagem(conversaId);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!conversaId) throw new Error('ID da conversa é necessário');

      logger.info('📎 Iniciando upload de arquivo:', file.name);

      // 1. Sanitiza o nome do arquivo para evitar caracteres inválidos
      const sanitizedFileName = sanitizeFileName(file.name);
      const filePath = `${conversaId}/${Date.now()}_${sanitizedFileName}`;

      logger.info('📎 Nome sanitizado:', sanitizedFileName);
      logger.info('📎 Caminho do arquivo:', filePath);

      // 2. Faz o upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('anexos_chat')
        .upload(filePath, file);

      if (uploadError) {
        logger.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      logger.info('📎 Upload realizado com sucesso');

      // 3. Determina o tipo e cria os metadados
      const tipo = file.type.startsWith('image/') ? 'imagem' : 'arquivo';
      const metadata = {
        path: filePath, // Salva o caminho para gerar URLs assinadas depois
        nome: file.name, // Mantém o nome original para exibição
        tipoArquivo: file.type,
        tamanho: file.size,
      };

      // 4. Envia a "mensagem" do tipo arquivo/imagem
      const conteudo = tipo === 'imagem' ? 'Enviou uma imagem' : `Enviou o arquivo: ${file.name}`;
      
      return await enviarMensagem.mutateAsync({ 
        conteudo, 
        tipo, 
        metadata 
      });
    },
    onSuccess: (data) => {
      logger.info('✅ Upload realizado com sucesso:', data);
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error) => {
      logger.error('❌ Erro no upload:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    }
  });

  return uploadMutation;
};
