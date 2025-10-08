import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DocumentoFuncionario {
  id: string;
  funcionario_id: string;
  dependente_id: string | null;
  tipo_documento: string;
  nome_arquivo: string;
  path_storage: string;
  created_at: string;
}

export const useDocumentosFuncionario = (funcionarioId: string | null, dependenteId?: string | null) => {
  const queryClient = useQueryClient();

  const { data: documentos = [], isLoading } = useQuery({
    queryKey: ['documentos-funcionario', funcionarioId, dependenteId],
    queryFn: async () => {
      if (!funcionarioId) return [];

      let query = supabase
        .from('documentos_funcionarios')
        .select('*')
        .eq('funcionario_id', funcionarioId);

      if (dependenteId) {
        query = query.eq('dependente_id', dependenteId);
      } else {
        query = query.is('dependente_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as DocumentoFuncionario[];
    },
    enabled: !!funcionarioId,
  });

  const uploadDocumento = useMutation({
    mutationFn: async ({
      file,
      tipoDocumento,
      dependenteId,
    }: {
      file: File;
      tipoDocumento: string;
      dependenteId?: string | null;
    }) => {
      if (!funcionarioId) throw new Error('funcionarioId não fornecido');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = dependenteId
        ? `${funcionarioId}/dependentes/${dependenteId}/${tipoDocumento}/${fileName}`
        : `${funcionarioId}/documentos/${tipoDocumento}/${fileName}`;

      // Upload para Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('documentos_funcionarios')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Criar registro no banco
      const { data, error: dbError } = await supabase
        .from('documentos_funcionarios')
        .insert([
          {
            funcionario_id: funcionarioId,
            dependente_id: dependenteId || null,
            tipo_documento: tipoDocumento,
            nome_arquivo: file.name,
            path_storage: filePath,
          },
        ])
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-funcionario', funcionarioId, dependenteId] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar documento');
    },
  });

  const deleteDocumento = useMutation({
    mutationFn: async (documento: DocumentoFuncionario) => {
      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from('documentos_funcionarios')
        .remove([documento.path_storage]);

      if (storageError) throw storageError;

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('documentos_funcionarios')
        .delete()
        .eq('id', documento.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentos-funcionario', funcionarioId, dependenteId] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar documento:', error);
      toast.error('Erro ao excluir documento');
    },
  });

  const getDownloadUrl = async (path: string) => {
    const { data, error } = await supabase.storage
      .from('documentos_funcionarios')
      .createSignedUrl(path, 3600);

    if (error) throw error;
    return data.signedUrl;
  };

  return {
    documentos,
    isLoading,
    uploadDocumento,
    deleteDocumento,
    getDownloadUrl,
  };
};
