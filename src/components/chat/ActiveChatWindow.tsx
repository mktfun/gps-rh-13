
import React, { useState } from 'react';
import { ArrowLeft, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ActiveChatWindowProps {
  conversaId: string;
  empresaNome: string;
  onBack: () => void;
}

export const ActiveChatWindow: React.FC<ActiveChatWindowProps> = ({
  conversaId,
  empresaNome,
  onBack
}) => {
  const [novoConteudo, setNovoConteudo] = useState('');

  const handleEnviar = () => {
    const conteudo = novoConteudo.trim();
    if (!conteudo) return;

    console.log('Enviando mensagem:', { conversaId, conteudo });
    // TODO: Implementar envio de mensagem
    setNovoConteudo('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho */}
      <div className="flex items-center p-4 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="mr-3 p-1"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8 mr-3">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-medium text-sm">{empresaNome}</h3>
          <p className="text-xs text-muted-foreground">Conversa ativa</p>
        </div>
      </div>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto p-4 bg-background">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground text-sm">
            Mensagens aparecerão aqui
          </p>
        </div>
      </div>

      {/* Campo de digitação */}
      <div className="border-t p-4 bg-background">
        <div className="flex space-x-2">
          <Input
            value={novoConteudo}
            onChange={(e) => setNovoConteudo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            className="flex-1"
          />
          <Button
            onClick={handleEnviar}
            disabled={!novoConteudo.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {novoConteudo.length}/500 caracteres
        </p>
      </div>
    </div>
  );
};
