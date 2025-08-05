
import React, { useState, useEffect } from 'react';
import { Clock, Check, CheckCheck, File, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useSignedUrl } from '@/hooks/useSignedUrl';

interface MessageBubbleProps {
  mensagem: {
    id: number | string;
    remetente_id: string;
    conteudo: string;
    created_at: string;
    lida: boolean;
    lida_em: string | null;
    status?: 'enviando' | 'enviado' | 'erro';
    tipo?: string;
    metadata?: {
      path: string;
      nome: string;
      tipoArquivo: string;
      tamanho: number;
    };
  };
  isFromMe: boolean;
  compact?: boolean;
}

const MessageStatusIcon = React.memo(({ mensagem, isFromMe }: { 
  mensagem: MessageBubbleProps['mensagem']; 
  isFromMe: boolean; 
}) => {
  if (!isFromMe) return null;

  switch (mensagem.status) {
    case 'enviando':
      return <Clock className="h-3 w-3 text-primary-foreground/50 animate-pulse" />;
    case 'erro':
      return <span className="text-destructive text-xs font-bold">!</span>;
    case 'enviado':
    default:
      if (mensagem.lida_em) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      }
      return <Check className="h-3 w-3 text-primary-foreground/60" />;
  }
});

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const ImagePreview: React.FC<{ filePath: string; fileName: string }> = ({ filePath, fileName }) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const { getSignedUrl } = useSignedUrl();

  useEffect(() => {
    const loadImage = async () => {
      try {
        const url = await getSignedUrl(filePath, 3600);
        setImageUrl(url);
      } catch (error) {
        console.error('Erro ao carregar imagem:', error);
      }
    };
    loadImage();
  }, [filePath, getSignedUrl]);

  if (!imageUrl) {
    return (
      <div className="rounded-lg max-w-xs max-h-64 bg-muted animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Carregando...</span>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <img 
          src={imageUrl} 
          alt={fileName}
          className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] p-2">
        <img 
          src={imageUrl} 
          alt={fileName}
          className="max-h-[85vh] w-full object-contain rounded-lg"
        />
      </DialogContent>
    </Dialog>
  );
};

export const MessageBubble = React.memo<MessageBubbleProps>(({ 
  mensagem, 
  isFromMe, 
  compact = false 
}) => {
  const { downloadFile } = useSignedUrl();

  const timeAgo = React.useMemo(() => {
    return formatDistanceToNow(new Date(mensagem.created_at), {
      addSuffix: true,
      locale: ptBR
    });
  }, [mensagem.created_at]);

  const renderContent = () => {
    const filePath = mensagem.metadata?.path;

    // LÓGICA À PROVA DE BALAS: Se tem metadata com path, É um arquivo/imagem
    if (filePath) {
      // Se o tipo do arquivo nos metadados começa com 'image/', renderiza como imagem
      if (mensagem.metadata?.tipoArquivo?.startsWith('image/')) {
        return (
          <div className="space-y-2">
            <ImagePreview 
              filePath={filePath} 
              fileName={mensagem.metadata.nome || 'Imagem enviada'}
            />
            {mensagem.conteudo && mensagem.conteudo !== 'Enviou uma imagem' && (
              <p className="text-sm">{mensagem.conteudo}</p>
            )}
          </div>
        );
      }

      // Senão, renderiza como arquivo genérico para download
      return (
        <div className="space-y-2">
          <button 
            onClick={() => downloadFile(filePath)}
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors hover:bg-accent/20 w-full ${
              isFromMe 
                ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                : 'bg-muted border-border'
            }`}
          >
            <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="font-medium text-sm truncate">
                {mensagem.metadata.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(mensagem.metadata.tamanho)}
              </p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
          {mensagem.conteudo && !mensagem.conteudo.startsWith('Enviou o arquivo:') && (
            <p className="text-sm">{mensagem.conteudo}</p>
          )}
        </div>
      );
    }

    // Se nada disso for verdade, aí sim é uma mensagem de texto
    return (
      <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
        {mensagem.conteudo}
      </p>
    );
  };

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isFromMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {renderContent()}
        <div className={`flex items-center justify-between mt-2 gap-2 ${
          compact ? 'text-xs' : 'text-xs'
        }`}>
          <span className={`${
            isFromMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
          }`}>
            {timeAgo}
          </span>
          <MessageStatusIcon mensagem={mensagem} isFromMe={isFromMe} />
        </div>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';
