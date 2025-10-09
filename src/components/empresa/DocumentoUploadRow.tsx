import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Cloud, Pencil, Trash2, Check, X, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDocumentosFuncionario, DocumentoFuncionario } from '@/hooks/useDocumentosFuncionario';

interface DocumentoUploadRowProps {
  tipoDocumento: string;
  label: string;
  descricao: string;
  funcionarioId: string;
  dependenteId?: string | null;
  readOnly?: boolean;
}

export const DocumentoUploadRow: React.FC<DocumentoUploadRowProps> = ({
  tipoDocumento,
  label,
  descricao,
  funcionarioId,
  dependenteId,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const { documentos, uploadDocumento, deleteDocumento, getDownloadUrl } = useDocumentosFuncionario(
    funcionarioId,
    dependenteId
  );

  const documento = documentos.find((doc) => doc.tipo_documento === tipoDocumento);
  const isUploading = uploadDocumento.isPending;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadProgress(0);
    setShowError(false);

    try {
      await uploadDocumento.mutateAsync({ file, tipoDocumento, dependenteId });
      setUploadProgress(100);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!documento) return;
    await deleteDocumento.mutateAsync(documento);
  };

  const handleDownload = async () => {
    if (!documento) return;
    try {
      const url = await getDownloadUrl(documento.path_storage);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 border-b last:border-0">
      <div className="flex-1">
        <h4 className="text-sm font-medium">{label}</h4>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {!readOnly && !documento && !isUploading && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
            >
              <Cloud className="h-4 w-4" />
              Anexar Arquivo
            </Button>
          </>
        )}

        {readOnly && !documento && (
          <span className="text-sm text-muted-foreground">Nenhum documento enviado</span>
        )}

        {isUploading && (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
          </div>
        )}

        {documento && !isUploading && (
          <div className="flex items-center gap-2">
            <Button
              variant="link"
              size="sm"
              onClick={handleDownload}
              className="gap-1 text-xs px-2"
            >
              <Download className="h-3 w-3" />
              {documento.nome_arquivo}
            </Button>
            {!readOnly && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 w-8"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </>
            )}
          </div>
        )}

        {showSuccess && (
          <div className="flex items-center gap-1 text-green-600">
            <Check className="h-4 w-4" />
          </div>
        )}

        {showError && (
          <div className="flex items-center gap-1 text-destructive">
            <X className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
};
