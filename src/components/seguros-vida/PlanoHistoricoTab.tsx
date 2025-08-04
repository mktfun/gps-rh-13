
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const PlanoHistoricoTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico do Plano</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Histórico de alterações e movimentações do plano em desenvolvimento.
        </p>
      </CardContent>
    </Card>
  );
};
