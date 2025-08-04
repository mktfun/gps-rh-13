
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMensagens } from '@/hooks/useMensagens';
import { useEnviarMensagem } from '@/hooks/useEnviarMensagem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { MessageCircle, Send, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageBubble } from './MessageBubble';

interface ChatModuleProps {
  conversaId: string;
  destinatarioNome: string;
  onClose?: () => void;
  compact?: boolean;
}

export const ChatModule: React.FC<ChatModuleProps> = ({
  conversaId,
  destinatarioNome,
  onClose,
  compact = false
}) => {
  const { user } = useAuth();
  const { mensagens, isLoading } = useMensagens(conversaId);
  const enviarMensagem = useEnviarMensagem(conversaId);
  const [novoConteudo, setNovoConteudo] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensagens]);

  // Focar input quando conversa muda
  useEffect(() => {
    if (inputRef.current && !compact) {
      inputRef.current.focus();
    }
  }, [conversaId, compact]);

  const handleEnviar = async () => {
    const conteudo = novoConteudo.trim();
    if (!conteudo || enviarMensagem.isPending) return;

    // Limpar input imediatamente para UX responsiva
    setNovoConteudo('');
    
    try {
      await enviarMensagem.mutateAsync({ conteudo });
    } catch (error) {
      // Em caso de erro, restaurar o conteúdo do input
      setNovoConteudo(conteudo);
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (isLoading) {
    return (
      <Card className={compact ? "h-full" : "h-96"}>
        <CardContent className="flex items-center justify-center h-full">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 animate-pulse" />
            <span>Carregando chat...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerClass = compact 
    ? "h-full flex flex-col" 
    : "h-96 flex flex-col";

  return (
    <Card className={containerClass}>
      {!compact && (
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-sm">{destinatarioNome}</h3>
                <p className="text-xs text-muted-foreground">
                  {mensagens.length} mensagem{mensagens.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-3">
            {mensagens.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-sm">
                  Nenhuma mensagem ainda. Inicie a conversa!
                </p>
              </div>
            ) : (
              mensagens.map((mensagem) => (
                <MessageBubble
                  key={mensagem.id}
                  mensagem={mensagem}
                  isFromMe={mensagem.remetente_id === user?.id}
                  compact={compact}
                />
              ))
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={novoConteudo}
              onChange={(e) => setNovoConteudo(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              maxLength={500}
              disabled={enviarMensagem.isPending}
              className="flex-1"
            />
            <Button
              onClick={handleEnviar}
              disabled={!novoConteudo.trim() || enviarMensagem.isPending}
              size="sm"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {!compact && (
            <p className="text-xs text-muted-foreground mt-1">
              {novoConteudo.length}/500 caracteres
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
