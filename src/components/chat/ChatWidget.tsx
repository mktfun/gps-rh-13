
import React, { useState } from 'react';
import { useConversas } from '@/hooks/useConversas';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import { ConversasList } from './ConversasList';

interface ChatWidgetProps {
  onOpenChat?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpenChat }) => {
  const { conversas, isLoading } = useConversas();
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
            <CardContent className="p-4 flex items-center justify-center flex-1">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Carregando...</span>
              </div>
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
        <CardContent className="p-0 flex-1 flex flex-col">
          <ConversasList
            onSelecionarConversa={() => {}}
            compact={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};
