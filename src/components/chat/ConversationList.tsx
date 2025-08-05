
import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Conversa {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
  protocolo?: string | null; // Tem que ter o protocolo aqui!
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
      <span>CARALHO, ATUALIZA ESSA PORRA!</span>
      {conversas.map((conversa) => (
        <button
          key={conversa.conversa_id}
          className="w-full p-4 text-left rounded-lg hover:bg-muted transition-colors border border-border"
          onClick={() => onSelectConversa(conversa.conversa_id, conversa.empresa_nome)}
        >
          <div className="flex w-full justify-between items-center">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">{conversa.empresa_nome}</span>
                {/* ESTA É A LÓGICA QUE PREENCHE A CAIXA VERMELHA */}
                {conversa.protocolo && (
                  <span className="text-xs text-muted-foreground">#{conversa.protocolo}</span>
                )}
              </div>
            </div>
            <span className="text-xs text-muted-foreground ml-2">
              {new Date(conversa.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
};
