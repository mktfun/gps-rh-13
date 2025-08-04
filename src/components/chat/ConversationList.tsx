
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversa {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
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
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
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
          className="w-full p-3 text-left rounded-md hover:bg-muted transition-colors border border-border"
          onClick={() => onSelectConversa(conversa.conversa_id, conversa.empresa_nome)}
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
  );
};
