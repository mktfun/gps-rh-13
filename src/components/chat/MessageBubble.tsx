
import React from 'react';
import { Clock, Check, CheckCheck, File, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
      url: string;
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
      // Se tem timestamp de leitura, mostrar check duplo azul
      if (mensagem.lida_em) {
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      }
      // Se apenas entregue (sem leitura), mostrar check simples cinza
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

export const MessageBubble = React.memo<MessageBubbleProps>(({ 
  mensagem, 
  isFromMe, 
  compact = false 
}) => {
  const timeAgo = React.useMemo(() => {
    return formatDistanceToNow(new Date(mensagem.created_at), {
      addSuffix: true,
      locale: ptBR
    });
  }, [mensagem.created_at]);

  const renderContent = () => {
    // Renderizar imagem
    if (mensagem.tipo === 'imagem' && mensagem.metadata?.url) {
      return (
        <div className="space-y-2">
          <img 
            src={mensagem.metadata.url} 
            alt={mensagem.metadata.nome || 'Imagem enviada'}
            className="rounded-lg max-w-xs max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(mensagem.metadata?.url, '_blank')}
          />
          {mensagem.conteudo && (
            <p className="text-sm">{mensagem.conteudo}</p>
          )}
        </div>
      );
    }

    // Renderizar arquivo
    if (mensagem.tipo === 'arquivo' && mensagem.metadata?.url) {
      return (
        <div className="space-y-2">
          <a 
            href={mensagem.metadata.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors hover:bg-accent/20 ${
              isFromMe 
                ? 'bg-primary-foreground/10 border-primary-foreground/20' 
                : 'bg-muted border-border'
            }`}
          >
            <File className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {mensagem.metadata.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(mensagem.metadata.tamanho)}
              </p>
            </div>
            <Download className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </a>
          {mensagem.conteudo && (
            <p className="text-sm">{mensagem.conteudo}</p>
          )}
        </div>
      );
    }

    // Fallback para texto normal
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
