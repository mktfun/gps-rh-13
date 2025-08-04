
import React from 'react';
import { Clock, Check, CheckCheck } from 'lucide-react';
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

  return (
    <div className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isFromMe
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {mensagem.conteudo}
        </p>
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
