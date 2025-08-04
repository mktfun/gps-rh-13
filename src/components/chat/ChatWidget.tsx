
import React, { useState } from 'react';
import { useConversas } from '@/hooks/useConversas';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2, Plus, X } from 'lucide-react';
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
        <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
          <Card className="w-96 h-[500px] animate-scale-in">
            <CardContent className="p-4 flex items-center justify-center h-full">
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
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={toggleExpanded}
            className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          </Button>
        </div>
      );
    }
  }

  // Collapsed state (default)
  if (!isExpanded) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleExpanded}
          className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in"
        >
          <MessageCircle className="h-6 w-6 text-primary-foreground" />
        </Button>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="fixed bottom-6 right-6 z-50 transition-all duration-300">
      <Card className="w-96 h-[500px] animate-scale-in shadow-xl">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-medium">Chat</h3>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
              {onOpenChat && (
                <Button size="sm" variant="outline" onClick={onOpenChat}>
                  Abrir Chat
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={toggleExpanded}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
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
