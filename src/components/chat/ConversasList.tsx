
import React from 'react';
import { useConversas } from '@/hooks/useConversas';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Plus, Users, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConversasListProps {
  onSelecionarConversa: (conversaId: string, nomeDestinatario: string) => void;
  conversaSelecionada?: string;
  compact?: boolean;
  onNovaConversa?: () => void;
}

export const ConversasList: React.FC<ConversasListProps> = ({
  onSelecionarConversa,
  conversaSelecionada,
  compact = false,
  onNovaConversa
}) => {
  const { conversas, isLoading, createConversaCorretora } = useConversas();
  const { user } = useAuth();
  
  // Determinar role do usuário baseado na estrutura do user
  const role = user?.user_metadata?.role || 'empresa';

  if (isLoading) {
    return (
      <Card className={compact ? "h-full" : ""}>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Carregando conversas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const containerClass = compact ? "h-full" : "";

  return (
    <Card className={containerClass}>
      {!compact && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-medium">Conversas</h3>
            </div>
            {onNovaConversa && (
              <Button
                size="sm"
                variant="outline"
                onClick={onNovaConversa}
                disabled={createConversaCorretora.isPending}
              >
                {createConversaCorretora.isPending ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Nova
              </Button>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0">
        {conversas.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm mb-3">
              Nenhuma conversa encontrada
            </p>
            {onNovaConversa && (
              <Button
                size="sm"
                onClick={onNovaConversa}
                disabled={createConversaCorretora.isPending}
              >
                {createConversaCorretora.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {role === 'corretora' ? 'Iniciar conversa com empresa' : 'Conversar com corretora'}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-0">
            {conversas.map((conversa) => {
              // Determinar o nome do destinatário baseado no role
              let nomeDestinatario: string;
              
              if (role === 'corretora') {
                // Corretora vê o nome da empresa
                nomeDestinatario = conversa.empresas?.nome || `Empresa ${conversa.empresa_id?.substring(0, 8) || ''}`;
              } else {
                // Empresa vê o nome da corretora
                nomeDestinatario = conversa.profiles?.nome || `Corretora ${conversa.corretora_id?.substring(0, 8) || ''}`;
              }

              const isSelected = conversaSelecionada === conversa.id;

              return (
                <div
                  key={conversa.id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 border-b border-border last:border-b-0 transition-colors ${
                    isSelected ? 'bg-muted' : ''
                  }`}
                  onClick={() => onSelecionarConversa(conversa.id, nomeDestinatario)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
                      <AvatarFallback>
                        {nomeDestinatario.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium truncate ${compact ? 'text-xs' : 'text-sm'}`}>
                          {nomeDestinatario}
                        </h4>
                        {!compact && (
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(conversa.created_at), {
                              addSuffix: true,
                              locale: ptBR
                            })}
                          </span>
                        )}
                      </div>
                      <p className={`text-muted-foreground mt-1 ${compact ? 'text-xs' : 'text-xs'}`}>
                        Conversa iniciada
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
