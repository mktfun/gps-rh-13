
import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Loader2, Hash, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMensagens } from '@/hooks/useMensagens';
import { useEnviarMensagem } from '@/hooks/useEnviarMensagem';
import { useUploadAnexo } from '@/hooks/useUploadAnexo';
import { useConversaComProtocolo } from '@/hooks/useConversaComProtocolo';
import { useAuth } from '@/hooks/useAuth';
import { MessageBubble } from './MessageBubble';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { mensagens, isLoading, onlineUsers, marcarComoLidas } = useMensagens(conversaId);
  const { conversa } = useConversaComProtocolo(conversaId);
  const enviarMensagem = useEnviarMensagem(conversaId);
  const uploadAnexo = useUploadAnexo(conversaId);

  // Determinar se o outro usuário está online
  const isOtherUserOnline = onlineUsers.length > 1;

  // Auto-scroll para mensagens novas
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  // Marcar mensagens como lidas quando o componente monta ou conversaId muda
  useEffect(() => {
    if (conversaId) {
      marcarComoLidas.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversaId]);

  const handleEnviar = async () => {
    const conteudo = novoConteudo.trim();
    if (!conteudo || enviarMensagem.isPending) return;

    setNovoConteudo(''); // Limpar campo imediatamente

    try {
      await enviarMensagem.mutateAsync({ conteudo });
    } catch (error) {
      setNovoConteudo(conteudo); // Restaurar em caso de erro
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAnexo.mutate(file);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Cabeçalho com protocolo */}
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
            {empresaNome.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-sm">{empresaNome}</h3>
            {conversa?.protocolo && (
              <Badge variant="outline" className="text-xs">
                <Hash className="h-3 w-3 mr-1" />
                {conversa.protocolo}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <div 
              className={`w-2 h-2 rounded-full ${
                isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} 
            />
            <p className="text-xs text-muted-foreground">
              {isOtherUserOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>

      {/* Área de mensagens */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 bg-background"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Carregando mensagens...</p>
            </div>
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-sm">
              Nenhuma mensagem ainda. Inicie a conversa!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {mensagens.map((mensagem) => (
              <MessageBubble
                key={mensagem.id}
                mensagem={mensagem}
                isFromMe={mensagem.remetente_id === user?.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Campo de digitação */}
      <div className="border-t p-4 bg-background">
        <div className="flex space-x-2">
          <input
            type="file"
            ref={inputFileRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => inputFileRef.current?.click()}
            disabled={uploadAnexo.isPending}
            className="shrink-0"
          >
            {uploadAnexo.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Paperclip className="h-4 w-4" />
            )}
          </Button>
          <Input
            value={novoConteudo}
            onChange={(e) => setNovoConteudo(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            maxLength={500}
            className="flex-1"
            disabled={enviarMensagem.isPending || uploadAnexo.isPending}
          />
          <Button
            onClick={handleEnviar}
            disabled={!novoConteudo.trim() || enviarMensagem.isPending || uploadAnexo.isPending}
            size="sm"
          >
            {enviarMensagem.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {novoConteudo.length}/500 caracteres
        </p>
      </div>
    </div>
  );
};
