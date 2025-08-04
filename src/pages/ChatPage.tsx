
import React, { useState } from 'react';
import { ConversasList } from '@/components/chat/ConversasList';
import { ChatModule } from '@/components/chat/ChatModule';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { role } = useAuth();
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [nomeDestinatario, setNomeDestinatario] = useState<string>('');

  const handleSelecionarConversa = (conversaId: string, nome: string) => {
    setConversaSelecionada(conversaId);
    setNomeDestinatario(nome);
  };

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-muted-foreground">
          {role === 'corretora' 
            ? 'Converse com suas empresas clientes'
            : 'Converse com sua corretora'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Lista de conversas */}
        <div className="lg:col-span-1">
          <ConversasList
            onSelecionarConversa={handleSelecionarConversa}
            conversaSelecionada={conversaSelecionada || undefined}
          />
        </div>

        {/* Chat ativo */}
        <div className="lg:col-span-2">
          {conversaSelecionada ? (
            <ChatModule
              conversaId={conversaSelecionada}
              destinatarioNome={nomeDestinatario}
            />
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent>
                <div className="text-center">
                  <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium mb-2">Selecione uma conversa</h3>
                  <p className="text-muted-foreground text-sm">
                    Escolha uma conversa na lista ao lado para começar a trocar mensagens
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
