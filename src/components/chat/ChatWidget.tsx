
import React, { useState } from 'react';
import { useConversasWidget } from '@/hooks/useConversasWidget';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ChatWidgetProps {
  onOpenChat?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpenChat }) => {
  const { conversas, isLoading } = useConversasWidget();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Loading state
  if (isLoading) {
    if (isExpanded) {
      return (
        <div className="fixed bottom-0 right-6 z-50 transition-all duration-300">
          <Card className="w-96 h-[450px] animate-scale-in shadow-xl">
            <div 
              className="h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg"
              onClick={toggleExpanded}
            >
              <span className="font-medium">Conversas</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      );
    } else {
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
  }

  // Collapsed state (Chat Bar)
  if (!isExpanded) {
    return (
      <div className="fixed bottom-0 right-6 z-50">
        <div 
          className="w-80 h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
          onClick={toggleExpanded}
        >
          <span className="font-medium">Conversas</span>
          <ChevronUp className="h-4 w-4" />
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="fixed bottom-0 right-6 z-50 transition-all duration-300">
      <Card className="w-96 h-[450px] animate-scale-in shadow-xl">
        <div 
          className="h-12 bg-primary text-primary-foreground px-4 flex items-center justify-between cursor-pointer rounded-t-lg"
          onClick={toggleExpanded}
        >
          <span className="font-medium">Conversas</span>
          <div className="flex items-center space-x-2">
            {onOpenChat && (
              <Button size="sm" variant="secondary" onClick={onOpenChat}>
                Abrir Chat
              </Button>
            )}
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
          {conversas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma conversa iniciada</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-2">
              {conversas.map((conversa) => (
                <button
                  key={conversa.conversa_id}
                  className="w-full p-3 text-left rounded-md hover:bg-muted transition-colors border border-border"
                  onClick={() => {
                    console.log('Conversa selecionada:', conversa.conversa_id);
                    // Funcionalidade futura para selecionar conversa
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {conversa.empresa_nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversa.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
