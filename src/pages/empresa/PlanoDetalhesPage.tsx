
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Shield, Building2, FileText, DollarSign, Heart, AlertTriangle, Flower2 } from 'lucide-react';

const PlanoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: plano, isLoading, error } = usePlanoDetalhes(id!);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Plano"
          description={error instanceof Error ? error.message : 'Ocorreu um erro inesperado'}
        />
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          icon={FileText}
          title="Plano não encontrado"
          description="Não foi possível encontrar os detalhes para este plano."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Detalhes do Plano</h1>
        <p className="text-muted-foreground">Plano ID: {id}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Gerais */}
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
                <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                <p className="text-sm font-medium">{plano.empresa_nome}</p>
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
                    <div className="text-xl font-bold text-green-600">{formatCurrency(plano.valor_mensal)}</div>
                    <div className="text-xs text-muted-foreground">Por CNPJ</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coberturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Coberturas Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Heart className="h-4 w-4 text-red-500" />
                  <div>
                    <h4 className="font-medium text-sm">Morte Natural</h4>
                    <p className="text-xs text-muted-foreground">Cobertura básica por morte natural</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(plano.cobertura_morte)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <div>
                    <h4 className="font-medium text-sm">Morte Acidental</h4>
                    <p className="text-xs text-muted-foreground">Cobertura adicional em caso de acidente</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(plano.cobertura_morte_acidental)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-sm">Invalidez por Acidente</h4>
                    <p className="text-xs text-muted-foreground">Proteção contra invalidez permanente</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(plano.cobertura_invalidez_acidente)}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <Flower2 className="h-4 w-4 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-sm">Auxílio Funeral</h4>
                    <p className="text-xs text-muted-foreground">Auxílio para despesas funerárias</p>
                  </div>
                </div>
                <span className="font-bold text-lg">{formatCurrency(plano.cobertura_auxilio_funeral)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanoDetalhesPage;
