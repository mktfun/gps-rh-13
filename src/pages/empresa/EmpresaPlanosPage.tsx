
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, DollarSign, Eye } from 'lucide-react';
import { useEmpresaPlanos } from '@/hooks/useEmpresaPlanos';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { PlanoDetalhesModal } from '@/components/planos/PlanoDetalhesModal';

const EmpresaPlanosPage = () => {
  const { data: planos, isLoading, error } = useEmpresaPlanos();
  const [planoSelecionadoId, setPlanoSelecionadoId] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <DashboardLoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Shield}
          title="Erro ao carregar planos"
          description="Não foi possível carregar os planos de seguro. Tente novamente."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Planos de Seguro</h1>
        <p className="text-muted-foreground">
          Gerencie os planos de seguro de vida da sua empresa
        </p>
      </div>

      {!planos || planos.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="Nenhum plano encontrado"
          description="Não há planos de seguro configurados para sua empresa ainda."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <Card key={plano.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {plano.seguradora}
                  </CardTitle>
                  <Badge variant="secondary">
                    {plano.tipo_seguro}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Valor Mensal</p>
                    <p className="font-semibold">{formatCurrency(plano.valor_mensal)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Cobertura Morte</p>
                    <p className="font-semibold">{formatCurrency(plano.cobertura_morte)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Funcionários: {plano.total_funcionarios || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Custo Total: {formatCurrency((plano.total_funcionarios || 0) * plano.valor_mensal)}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => setPlanoSelecionadoId(plano.id)}
                  className="w-full"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PlanoDetalhesModal
        planoId={planoSelecionadoId}
        open={!!planoSelecionadoId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPlanoSelecionadoId(null);
          }
        }}
      />
    </div>
  );
};

export default EmpresaPlanosPage;
