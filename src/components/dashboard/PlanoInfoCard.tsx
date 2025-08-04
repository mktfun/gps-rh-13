
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Building2, DollarSign, Heart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PlanoPrincipal {
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_invalidez: number;
  razao_social: string;
}

interface PlanoInfoCardProps {
  plano?: PlanoPrincipal;
}

const PlanoInfoCard = ({ plano }: PlanoInfoCardProps) => {
  if (!plano) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Plano de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum plano de seguro encontrado</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Plano Principal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Building2 className="h-3 w-3" />
              Seguradora
            </div>
            <p className="font-semibold">{plano.seguradora}</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              Valor Mensal
            </div>
            <p className="font-semibold text-green-600">
              {formatCurrency(plano.valor_mensal)}
            </p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <h4 className="font-medium text-sm">Coberturas</h4>
          
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="text-sm">Morte</span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(plano.cobertura_morte)}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-blue-500" />
                <span className="text-sm">Invalidez</span>
              </div>
              <span className="text-sm font-medium">
                {formatCurrency(plano.cobertura_invalidez)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Aplicado ao CNPJ: {plano.razao_social}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlanoInfoCard;
