
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';

const EmpresaPlanosPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Meus Planos</h1>
        <p className="text-muted-foreground">Visualize e gerencie seus planos de seguro</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Planos em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo reconstruída como parte da modernização da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Em breve você poderá visualizar todos os seus planos de seguro aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresaPlanosPage;
