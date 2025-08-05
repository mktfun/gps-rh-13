import React, { useState } from 'react';
import { useConversasWidget } from '@/hooks/useConversasWidget';
import { useTotalUnreadCount } from '@/hooks/useTotalUnreadCount';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronUp, ChevronDown, Plus } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ActiveChatWindow } from './ActiveChatWindow';
import { NovaConversaComProtocoloModal } from './NovaConversaComProtocoloModal';
import { NovaConversaModal } from './NovaConversaModal';
import { useAuth } from '@/hooks/useAuth';

interface ChatWidgetProps {
  onOpenChat?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpenChat }) => {
  const { conversas, isLoading } = useConversasWidget();
  const { data: totalUnreadCount = 0 } = useTotalUnreadCount();
  const { role } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedConversaId, setSelectedConversaId] = useState<string | null>(null);
  const [selectedEmpresaNome, setSelectedEmpresaNome] = useState<string>('');
  const [showNovaConversaModal, setShowNovaConversaModal] = useState(false);
  const [showNovaConversaCorretoraModal, setShowNovaConversaCorretoraModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    // Reset selected conversation when collapsing
    if (isExpanded) {
      setSelectedConversaId(null);
      setSelectedEmpresaNome('');
    }
  };

  const handleSelectConversa = (conversaId: string, empresaNome: string) => {
    setSelectedConversaId(conversaId);
    setSelectedEmpresaNome(empresaNome);
    console.log('Conversa selecionada:', conversaId);
  };

  const handleBackToList = () => {
    setSelectedConversaId(null);
    setSelectedEmpresaNome('');
  };

  const handleNovaConversaEmpresa = () => {
    setShowNovaConversaModal(true);
  };

  const handleNovaConversaCorretora = () => {
    setShowNovaConversaCorretoraModal(true);
  };

  const handleConversaCriada = (conversaId: string) => {
    // Selecionar automaticamente a nova conversa criada
    setSelectedConversaId(conversaId);
    // O nome da empresa será obtido pelo componente ActiveChatWindow
    setSelectedEmpresaNome('Nova Conversa');
  };

  // Filter conversations based on search term
  const filteredConversas = conversas.filter(conversa =>
    conversa.protocolo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conversa.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Loading state
  if (isLoading && !isExpanded) {
    return (
      <div className="fixed bottom-0 right-6 z-50">
        <div 
          className="w-80 h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
          onClick={toggleExpanded}
        >
          <span className="font-medium">Conversas</span>
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      </div>
    );
  }

  // Collapsed state (Chat Bar) - COM BADGE DE TOTAL
  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 right-6 z-50">
        <div className="relative">
          {/* Badge de total de mensagens não lidas */}
          {totalUnreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 z-10 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </Badge>
          )}
          
          <div 
            className="w-80 h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
            onClick={toggleExpanded}
          >
            <span className="font-medium">Conversas</span>
            <ChevronUp className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <>
      <div className="fixed bottom-0 right-6 z-50 transition-all duration-300">
        <Card className="w-96 h-[450px] animate-scale-in shadow-xl">
          <div 
            className="h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg"
            onClick={toggleExpanded}
          >
            <span className="font-medium">Conversas</span>
            <div className="flex items-center space-x-2">
              {!selectedConversaId && role === 'empresa' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNovaConversaEmpresa();
                  }}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {!selectedConversaId && role === 'corretora' && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNovaConversaCorretora();
                  }}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              {onOpenChat && (
                <Button 
                  size="sm" 
                  variant="secondary" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat();
                  }}
                >
                  Abrir Chat
                </Button>
              )}
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden h-[calc(450px-48px)]">
            {selectedConversaId ? (
              <ActiveChatWindow
                conversaId={selectedConversaId}
                empresaNome={selectedEmpresaNome}
                onBack={handleBackToList}
              />
            ) : (
              <>
                <div className="p-2 border-b border-border">
                  <Input
                    placeholder="Buscar por protocolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                </div>
                <ConversationList
                  conversas={filteredConversas}
                  isLoading={isLoading}
                  onSelectConversa={handleSelectConversa}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Nova Conversa para Empresa */}
      {role === 'empresa' && (
        <NovaConversaComProtocoloModal
          open={showNovaConversaModal}
          onClose={() => setShowNovaConversaModal(false)}
          onConversaCriada={handleConversaCriada}
        />
      )}

      {/* Modal de Nova Conversa para Corretora */}
      {role === 'corretora' && (
        <NovaConversaModal
          open={showNovaConversaCorretoraModal}
          onClose={() => setShowNovaConversaCorretoraModal(false)}
          onConversaCriada={handleConversaCriada}
        />
      )}
    </>
  );
};
