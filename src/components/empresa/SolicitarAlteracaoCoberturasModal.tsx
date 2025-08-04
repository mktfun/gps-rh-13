
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Send, Shield, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

interface SolicitarAlteracaoCoberturasModalProps {
  plano: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    cobertura_auxilio_funeral: number;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SolicitarAlteracaoCoberturasModal: React.FC<SolicitarAlteracaoCoberturasModalProps> = ({
  plano,
  open,
  onOpenChange,
}) => {
  const [justificativa, setJustificativa] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!justificativa.trim()) {
      toast.error('Por favor, preencha a justificativa para a alteração.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Aqui você implementaria a lógica para enviar a solicitação
      // Por exemplo, salvar na tabela de notificações ou enviar email
      
      // Simulando uma requisição
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Solicitação de alteração enviada com sucesso!');
      onOpenChange(false);
      setJustificativa('');
    } catch (error) {
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Solicitar Alteração de Coberturas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Plano Atual */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plano Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{plano.seguradora}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(plano.valor_mensal)}/mês
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Morte Natural:</span>
                  <span className="ml-2">{formatCurrency(plano.cobertura_morte)}</span>
                </div>
                <div>
                  <span className="font-medium">Morte Acidental:</span>
                  <span className="ml-2">{formatCurrency(plano.cobertura_morte_acidental)}</span>
                </div>
                <div>
                  <span className="font-medium">Invalidez por Acidente:</span>
                  <span className="ml-2">{formatCurrency(plano.cobertura_invalidez_acidente)}</span>
                </div>
                <div>
                  <span className="font-medium">Auxílio Funeral:</span>
                  <span className="ml-2">{formatCurrency(plano.cobertura_auxilio_funeral)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aviso Importante */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-orange-800 mb-1">
                    Importante sobre alterações de coberturas:
                  </p>
                  <ul className="text-orange-700 space-y-1 list-disc list-inside">
                    <li>Alterações estão sujeitas à análise e aprovação da corretora</li>
                    <li>Aumentos de cobertura podem exigir nova análise de risco</li>
                    <li>Mudanças podem impactar o valor da mensalidade</li>
                    <li>Algumas alterações podem ter período de carência</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Justificativa */}
          <div className="space-y-2">
            <Label htmlFor="justificativa">
              Justificativa da Alteração *
            </Label>
            <Textarea
              id="justificativa"
              placeholder="Descreva detalhadamente o motivo da solicitação de alteração nas coberturas do plano. Inclua informações sobre quais coberturas deseja alterar e por quê."
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Seja específico sobre quais coberturas deseja alterar e os motivos da solicitação.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !justificativa.trim()}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-b-transparent mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
