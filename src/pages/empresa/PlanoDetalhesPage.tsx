
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const PlanoDetalhesPage: React.FC = () => {
  const { id } = useParams();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Plano</h1>
        <p className="text-muted-foreground">Plano ID: {id}</p>
      </div>

      <Card>
        <CardHeader className="text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <CardTitle>Detalhes em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta funcionalidade está sendo reconstruída como parte da modernização da plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Em breve você poderá visualizar todos os detalhes do seu plano aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanoDetalhesPage;
