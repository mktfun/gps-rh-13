
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const HeaderTestPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Página de Teste do Header</h1>
        <p className="text-muted-foreground">
          Esta página testa se o header está funcionando corretamente
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teste Simples</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Se você está vendo esta página com o header completo, o problema não está no RootLayout.</p>
          <p>O problema provavelmente está em algum componente específico da página de gestão de planos.</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Card 1</h3>
            <p>Conteúdo do card 1</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Card 2</h3>
            <p>Conteúdo do card 2</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
