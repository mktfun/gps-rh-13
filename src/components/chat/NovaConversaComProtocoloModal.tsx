
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, FileText, Wrench, CreditCard, HelpCircle } from 'lucide-react';
import { useAssuntosAtendimento } from '@/hooks/useAssuntosAtendimento';
import { useIniciarConversaComProtocolo } from '@/hooks/useIniciarConversaComProtocolo';

interface NovaConversaComProtocoloModalProps {
  open: boolean;
  onClose: () => void;
  onConversaCriada?: (conversaId: string) => void;
}

const ASSUNTO_ICONS: { [key: string]: React.ComponentType<any> } = {
  'Dúvidas sobre Faturamento': CreditCard,
  'Problemas Técnicos': Wrench,
  'Alteração de Plano': FileText,
  'Outros Assuntos': HelpCircle
};

export const NovaConversaComProtocoloModal: React.FC<NovaConversaComProtocoloModalProps> = ({
  open,
  onClose,
  onConversaCriada
}) => {
  const [assuntoSelecionado, setAssuntoSelecionado] = useState<string | null>(null);
  
  const { assuntos, isLoading: loadingAssuntos } = useAssuntosAtendimento();
  const iniciarConversa = useIniciarConversaComProtocolo();

  const handleIniciarConversa = async () => {
    if (!assuntoSelecionado) return;

    try {
      const conversaId = await iniciarConversa.mutateAsync({
        assuntoId: assuntoSelecionado
      });

      // Fechar modal e resetar estado
      onClose();
      setAssuntoSelecionado(null);

      // Callback para navegar para a conversa criada
      if (onConversaCriada) {
        onConversaCriada(conversaId);
      }

    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setAssuntoSelecionado(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Iniciar Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Selecione o assunto da sua conversa. Um protocolo único será gerado automaticamente.
          </p>

          {/* Lista de assuntos */}
          <div className="space-y-2">
            {loadingAssuntos ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando assuntos...</span>
              </div>
            ) : (
              assuntos.map((assunto) => {
                const IconComponent = ASSUNTO_ICONS[assunto.nome] || HelpCircle;
                
                return (
                  <div
                    key={assunto.id}
                    onClick={() => setAssuntoSelecionado(assunto.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                      assuntoSelecionado === assunto.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-full ${
                        assuntoSelecionado === assunto.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <IconComponent className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{assunto.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {assunto.mensagem_padrao}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleIniciarConversa}
              disabled={!assuntoSelecionado || iniciarConversa.isPending}
            >
              {iniciarConversa.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Iniciar Conversa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
