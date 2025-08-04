
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, FileText, Shield } from 'lucide-react';

interface PlanoInfoCardReadOnlyProps {
  plano: {
    seguradora: string;
    valor_mensal: number;
    cnpj_numero: string;
    cnpj_razao_social: string;
  };
}

export const PlanoInfoCardReadOnly: React.FC<PlanoInfoCardReadOnlyProps> = ({ plano }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building2 className="h-5 w-5" />
          Informações Gerais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
              <Badge variant="secondary" className="text-sm font-medium">
                <Shield className="h-3 w-3 mr-1" />
                {plano.seguradora}
              </Badge>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-sm">{plano.cnpj_numero}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-muted-foreground">Razão Social</label>
            <p className="text-sm font-medium">{plano.cnpj_razao_social}</p>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Valor do Plano</span>
              <div className="text-right">
                <div className="text-xl font-bold">{formatCurrency(plano.valor_mensal)}</div>
                <div className="text-xs text-muted-foreground">Por CNPJ</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
