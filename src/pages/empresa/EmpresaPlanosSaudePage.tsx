import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Users, 
  DollarSign, 
  ExternalLink, 
  Building2,
  Plus
} from 'lucide-react';
import { useEmpresaPlanosPorTipo } from '@/hooks/useEmpresaPlanosPorTipo';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

const EmpresaPlanosSaudePage = () => {
  console.log('🩺 EmpresaPlanosSaudePage: Componente carregado');
  const { data: planos, isLoading, error } = useEmpresaPlanosPorTipo('saude');
  console.log('🩺 EmpresaPlanosSaudePage: Estado dos dados', { planos: planos?.length, isLoading, error });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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
          icon={Stethoscope}
          title="Erro ao carregar planos"
          description="Não foi possível carregar os planos de saúde. Tente novamente."
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="h-8 w-8" />
            Planos de Saúde
          </h1>
          <p className="text-muted-foreground">
            Gerencie os planos de saúde da sua empresa
          </p>
        </div>
      </div>

      {!planos || planos.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Nenhum plano de saúde encontrado"
          description="Não há planos de saúde configurados para sua empresa ainda."
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => {
            const funcionariosAtivos = plano.total_funcionarios || 0;
            // Usar o valor calculado se disponível, senão usar o valor original
            const valorReal = plano.valor_mensal_calculado ?? plano.valor_mensal;
            const custoPorFuncionario = funcionariosAtivos > 0 ? valorReal / funcionariosAtivos : 0;
            
            return (
              <Card key={plano.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Stethoscope className="h-5 w-5" />
                      {plano.seguradora}
                    </CardTitle>
                    <Badge variant="outline">
                      Plano de Saúde
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Valor Mensal Total</p>
                      <p className="font-semibold text-lg text-green-600">{formatCurrency(valorReal)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">CNPJ</p>
                      <p className="font-semibold text-sm">{plano.cnpj_razao_social}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Funcionários Ativos: {funcionariosAtivos}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Custo por Funcionário: {formatCurrency(custoPorFuncionario)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {plano.cnpj_numero}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1">
                      <Link to={`/empresa/planos-de-saude/${plano.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Gerenciar Plano
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmpresaPlanosSaudePage;
