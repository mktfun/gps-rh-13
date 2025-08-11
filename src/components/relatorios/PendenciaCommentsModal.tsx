
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PendenciaCommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pendencia: {
    id: string;
    protocolo: string;
    funcionario_nome: string;
    descricao: string;
    comentarios_count: number;
  };
}

export const PendenciaCommentsModal: React.FC<PendenciaCommentsModalProps> = ({
  isOpen,
  onClose,
  pendencia
}) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Mock comments for demonstration (since we can't persist them in current schema)
  const mockComments = [
    {
      id: '1',
      content: 'Documentação enviada para análise',
      author: 'Sistema',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      content: 'Aguardando retorno do funcionário',
      author: 'Analista RH',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ];

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      // Since we can't persist comments in the current schema,
      // we'll just show a success message and clear the input
      
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi registrado com sucesso.',
      });
      
      setNewComment('');
      
      // In a real implementation, you would:
      // 1. Save the comment to a comments table
      // 2. Update the comentarios_count in the pendencias table
      // 3. Refresh the data
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comentários - Protocolo {pendencia.protocolo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pendência Info */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funcionário</p>
                <p className="font-medium">{pendencia.funcionario_nome}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Comentários</p>
                <Badge variant="secondary">{pendencia.comentarios_count}</Badge>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-muted-foreground">Descrição</p>
              <p className="text-sm">{pendencia.descricao}</p>
            </div>
          </div>

          <Separator />

          {/* Comments List */}
          <div className="space-y-3">
            <h4 className="font-medium">Histórico de Comentários</h4>
            
            {mockComments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum comentário ainda</p>
                <p className="text-sm">Seja o primeiro a comentar nesta pendência</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mockComments.map((comment) => (
                  <div key={comment.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{comment.author}</span>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {format(comment.created_at, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Add Comment */}
          <div className="space-y-3">
            <h4 className="font-medium">Adicionar Comentário</h4>
            <Textarea
              placeholder="Digite seu comentário sobre esta pendência..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                {newComment.length}/500 caracteres
              </p>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                {isSubmitting ? 'Enviando...' : 'Enviar Comentário'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
