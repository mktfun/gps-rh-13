
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, DollarSign, Heart, AlertTriangle, Flower2, Building2, FileText } from 'lucide-react';
import { useEmpresaPlanos } from '@/hooks/useEmpresaPlanos';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

const EmpresaPlanosPage: React.FC = () => {
  const { data: planos, isLoading, error } = useEmpresaPlanos();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
        </Card>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Planos"
          description="Não foi possível carregar seus planos de seguro. Tente recarregar a página."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Meus Planos de Seguro
          </CardTitle>
          <CardDescription>
            Visualize e gerencie todos os seus planos de seguro de vida ativos.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Planos Grid */}
      {planos && planos.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <Card key={plano.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    {plano.seguradora}
                  </CardTitle>
                  <Badge variant="default">Ativo</Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {plano.cnpj_razao_social}
                </CardDescription>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  CNPJ: {plano.cnpj_numero}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Valor Mensal */}
                <div className="p-3 bg-primary/5 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <span className="font-medium">Valor Mensal</span>
                    </div>
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(plano.valor_mensal)}
                    </span>
                  </div>
                </div>

                {/* Coberturas */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-muted-foreground">Coberturas:</h4>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-red-500" />
                      <span>Morte Natural</span>
                    </div>
                    <span className="font-medium">{formatCurrency(plano.cobertura_morte)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Morte Acidental</span>
                    </div>
                    <span className="font-medium">{formatCurrency(plano.cobertura_morte_acidental)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Invalidez Acidente</span>
                    </div>
                    <span className="font-medium">{formatCurrency(plano.cobertura_invalidez_acidente)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Flower2 className="h-4 w-4 text-purple-500" />
                      <span>Auxílio Funeral</span>
                    </div>
                    <span className="font-medium">{formatCurrency(plano.cobertura_auxilio_funeral)}</span>
                  </div>
                </div>

                {/* Botão de Ação */}
                <Button asChild className="w-full mt-4">
                  <Link to={`/empresa/planos/${plano.id}`}>
                    Gerenciar Plano
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Shield}
          title="Nenhum Plano Encontrado"
          description="Sua empresa ainda não possui planos de seguro de vida cadastrados. Entre em contato com sua corretora para mais informações."
        />
      )}
    </div>
  );
};

export default EmpresaPlanosPage;
