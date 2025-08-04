
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Heart, AlertTriangle, Flower2 } from 'lucide-react';

interface PlanoCoberturasCardReadOnlyProps {
  plano: {
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    cobertura_auxilio_funeral: number;
  };
}

export const PlanoCoberturasCardReadOnly: React.FC<PlanoCoberturasCardReadOnlyProps> = ({ plano }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const coberturas = [
    {
      icon: Heart,
      label: 'Morte Natural',
      value: plano.cobertura_morte,
      description: 'Cobertura básica por morte natural'
    },
    {
      icon: AlertTriangle,
      label: 'Morte Acidental',
      value: plano.cobertura_morte_acidental,
      description: 'Cobertura adicional em caso de acidente'
    },
    {
      icon: Shield,
      label: 'Invalidez por Acidente',
      value: plano.cobertura_invalidez_acidente,
      description: 'Proteção contra invalidez permanente'
    },
    {
      icon: Flower2,
      label: 'Auxílio Funeral',
      value: plano.cobertura_auxilio_funeral,
      description: 'Auxílio para despesas funerárias'
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" />
          Coberturas Disponíveis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {coberturas.map((cobertura, index) => {
            const Icon = cobertura.icon;
            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium text-sm">{cobertura.label}</h4>
                    <p className="text-xs text-muted-foreground">{cobertura.description}</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(cobertura.value)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
