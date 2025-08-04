
import React from 'react';
import { useConversas } from '@/hooks/useConversas';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Loader2 } from 'lucide-react';
import { ConversasList } from './ConversasList';

interface ChatWidgetProps {
  onOpenChat?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onOpenChat }) => {
  const { conversas, isLoading } = useConversas();

  if (isLoading) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Card className="w-80 h-96">
          <CardContent className="p-4 flex items-center justify-center h-full">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Carregando...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="w-80 h-96">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-medium">Chat</h3>
            </div>
            {onOpenChat && (
              <Button size="sm" variant="outline" onClick={onOpenChat}>
                Abrir Chat
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1">
          <ConversasList
            onSelecionarConversa={() => {}}
            compact={true}
          />
        </CardContent>
      </Card>
    </div>
  );
};
