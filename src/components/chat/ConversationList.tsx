
import React from 'react';
import { MessageCircle, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversa {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
  protocolo?: string;
}

interface ConversationListProps {
  conversas: Conversa[];
  isLoading: boolean;
  onSelectConversa: (conversaId: string, empresaNome: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversas,
  isLoading,
  onSelectConversa
}) => {
  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (conversas.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nenhuma conversa iniciada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-2 p-4">
      {conversas.map((conversa) => (
        <button
          key={conversa.conversa_id}
          className="w-full p-4 text-left rounded-lg hover:bg-muted transition-colors border border-border"
          onClick={() => onSelectConversa(conversa.conversa_id, conversa.empresa_nome)}
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <MessageCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col space-y-1">
                <p className="font-medium text-sm truncate">
                  {conversa.empresa_nome}
                </p>
                {conversa.protocolo && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Hash className="h-3 w-3 mr-1" />
                    <span className="font-mono">{conversa.protocolo}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex-1" />
                <p className="text-xs text-muted-foreground">
                  {new Date(conversa.created_at).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};
