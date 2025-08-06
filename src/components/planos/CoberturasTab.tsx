
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Heart, AlertTriangle, Flower2 } from 'lucide-react';

interface PlanoDetalhes {
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
}

interface CoberturasTabProps {
  plano: PlanoDetalhes;
}

export const CoberturasTab: React.FC<CoberturasTabProps> = ({ plano }) => {
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
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <h4 className="font-medium">{cobertura.label}</h4>
                    <p className="text-sm text-muted-foreground">{cobertura.description}</p>
                  </div>
                </div>
                <span className="font-bold text-xl">{formatCurrency(cobertura.value)}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
