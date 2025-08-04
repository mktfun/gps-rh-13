
import React, { useState } from 'react';
import { ConversasList } from '@/components/chat/ConversasList';
import { ChatModule } from '@/components/chat/ChatModule';
import { NovaConversaModal } from '@/components/chat/NovaConversaModal';
import { useAuth } from '@/hooks/useAuth';
import { useConversas } from '@/hooks/useConversas';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const ChatPage: React.FC = () => {
  const { role } = useAuth();
  const { createConversaCorretora } = useConversas();
  const [conversaSelecionada, setConversaSelecionada] = useState<string | null>(null);
  const [nomeDestinatario, setNomeDestinatario] = useState<string>('');
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);

  const handleSelecionarConversa = (conversaId: string, nome: string) => {
    setConversaSelecionada(conversaId);
    setNomeDestinatario(nome);
  };

  const handleNovaConversa = async () => {
    if (role === 'corretora') {
      // Abrir modal para selecionar empresa
      setShowNovaConversaModal(true);
    } else if (role === 'empresa') {
      // Funcionalidade para empresa será implementada posteriormente
      console.log('Funcionalidade de nova conversa para empresa em desenvolvimento');
    }
  };

  const handleConversaCriada = (conversaId: string, nomeDestinatario: string) => {
    // Selecionar a conversa recém-criada
    handleSelecionarConversa(conversaId, nomeDestinatario);
  };

  return (
    <>
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
              onNovaConversa={handleNovaConversa}
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

      {/* Modal para nova conversa (corretoras) */}
      <NovaConversaModal
        open={showNovaConversaModal}
        onClose={() => setShowNovaConversaModal(false)}
        onConversaCriada={handleConversaCriada}
      />
    </>
  );
};
