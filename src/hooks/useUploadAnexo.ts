
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEnviarMensagem } from './useEnviarMensagem';
import { toast } from 'sonner';

export const useUploadAnexo = (conversaId: string) => {
  const enviarMensagem = useEnviarMensagem(conversaId);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!conversaId) throw new Error('ID da conversa é necessário');

      console.log('📎 Iniciando upload de arquivo:', file.name);

      // 1. Gera um nome de arquivo único para evitar conflitos
      const filePath = `${conversaId}/${Date.now()}_${file.name}`;

      // 2. Faz o upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('anexos_chat')
        .upload(filePath, file);

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }

      // 3. Pega a URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('anexos_chat')
        .getPublicUrl(filePath);

      console.log('📎 URL do arquivo:', publicUrl);

      // 4. Determina o tipo e cria os metadados
      const tipo = file.type.startsWith('image/') ? 'imagem' : 'arquivo';
      const metadata = {
        url: publicUrl,
        nome: file.name,
        tipoArquivo: file.type,
        tamanho: file.size,
      };

      // 5. Envia a "mensagem" do tipo arquivo/imagem
      const conteudo = tipo === 'imagem' ? 'Enviou uma imagem' : `Enviou o arquivo: ${file.name}`;
      
      return await enviarMensagem.mutateAsync({ 
        conteudo, 
        tipo, 
        metadata 
      });
    },
    onSuccess: (data) => {
      console.log('✅ Upload realizado com sucesso:', data);
      toast.success('Arquivo enviado com sucesso!');
    },
    onError: (error) => {
      console.error('❌ Erro no upload:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    }
  });

  return uploadMutation;
};
