
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
  valor_mensal_calculado?: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  empresa_nome: string;
  tipo_seguro?: 'vida' | 'saude' | 'outros';
}

interface PlanoDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: PlanoDetalhes | null;
}

export const PlanoDetalhesModal: React.FC<PlanoDetalhesModalProps> = ({
  isOpen,
  onClose,
  plano
}) => {
  if (!plano) return null;

  const getTipoSeguroLabel = (tipo?: string) => {
    switch (tipo) {
      case 'vida':
        return 'Seguro de Vida';
      case 'saude':
        return 'Plano de Saúde';
      case 'outros':
        return 'Outros';
      default:
        return 'Seguro de Vida';
    }
  };

  const getTipoSeguroColor = (tipo?: string) => {
    switch (tipo) {
      case 'vida':
        return 'bg-blue-100 text-blue-800';
      case 'saude':
        return 'bg-green-100 text-green-800';
      case 'outros':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes do Plano
            <Badge className={getTipoSeguroColor(plano.tipo_seguro)}>
              {getTipoSeguroLabel(plano.tipo_seguro)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Seguradora</p>
                  <p className="text-sm">{plano.seguradora}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Valor Mensal</p>
                  <p className="text-sm font-semibold">
                    {formatCurrency(plano.valor_mensal_calculado || plano.valor_mensal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CNPJ</p>
                  <p className="text-sm">{plano.cnpj_numero}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Razão Social</p>
                  <p className="text-sm">{plano.cnpj_razao_social}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coberturas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Morte</p>
                  <p className="text-sm font-semibold">{formatCurrency(plano.cobertura_morte)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Morte Acidental</p>
                  <p className="text-sm font-semibold">{formatCurrency(plano.cobertura_morte_acidental)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Invalidez por Acidente</p>
                  <p className="text-sm font-semibold">{formatCurrency(plano.cobertura_invalidez_acidente)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Auxílio Funeral</p>
                  <p className="text-sm font-semibold">{formatCurrency(plano.cobertura_auxilio_funeral)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
