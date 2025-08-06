
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, DollarSign, Heart, AlertTriangle, Flower2 } from 'lucide-react';
import { useEmpresaPlanos } from '@/hooks/useEmpresaPlanos';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

const EmpresaPlanosPage: React.FC = () => {
  const { data: planos, isLoading, error } = useEmpresaPlanos();

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Ocorreu um Erro"
        description="Não foi possível carregar seus planos. Tente recarregar a página."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Meus Planos de Seguro</CardTitle>
          <CardDescription>Visualize e gerencie todos os seus planos de seguro de vida ativos.</CardDescription>
        </CardHeader>
      </Card>

      {planos && planos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <Card key={plano.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plano.seguradora}</CardTitle>
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardDescription>CNPJ: {plano.cnpj_numero}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="text-2xl font-bold">{formatCurrency(plano.valor_mensal)}</p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">Coberturas:</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span>
                        <Heart className="h-4 w-4 inline mr-2 text-red-500"/>
                        Morte Natural
                      </span> 
                      <strong>{formatCurrency(plano.cobertura_morte)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>
                        <AlertTriangle className="h-4 w-4 inline mr-2 text-orange-500"/>
                        Morte Acidental
                      </span> 
                      <strong>{formatCurrency(plano.cobertura_morte_acidental)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>
                        <Shield className="h-4 w-4 inline mr-2 text-blue-500"/>
                        Invalidez Acidente
                      </span> 
                      <strong>{formatCurrency(plano.cobertura_invalidez_acidente)}</strong>
                    </li>
                    <li className="flex justify-between">
                      <span>
                        <Flower2 className="h-4 w-4 inline mr-2 text-purple-500"/>
                        Auxílio Funeral
                      </span> 
                      <strong>{formatCurrency(plano.cobertura_auxilio_funeral)}</strong>
                    </li>
                  </ul>
                </div>
                <Button asChild className="w-full mt-4">
                  <Link to={`/empresa/planos/${plano.id}`}>Gerenciar Plano</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title="Nenhum Plano Encontrado"
          description="Sua empresa ainda não possui planos de seguro de vida cadastrados."
        />
      )}
    </div>
  );
};

export default EmpresaPlanosPage;
