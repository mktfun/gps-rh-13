
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';

interface CostsKPICardsProps {
  custoTotalPeriodo: number;
  custoMedioFuncionario: number;
  variacaoPercentual: number;
  totalFuncionariosAtivos: number;
}

export const CostsKPICards = ({
  custoTotalPeriodo,
  custoMedioFuncionario,
  variacaoPercentual,
  totalFuncionariosAtivos
}: CostsKPICardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Garantir que variacaoPercentual tenha um valor padrão
  const safeVariacaoPercentual = variacaoPercentual || 0;
  const isPositiveVariation = safeVariacaoPercentual >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Total no Período</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(custoTotalPeriodo || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Soma de todos os planos ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Médio por Funcionário</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(custoMedioFuncionario || 0)}</div>
          <p className="text-xs text-muted-foreground">
            Baseado em {totalFuncionariosAtivos || 0} funcionários ativos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Variação vs. Período Anterior</CardTitle>
          {isPositiveVariation ? (
            <TrendingUp className="h-4 w-4 text-green-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${isPositiveVariation ? 'text-green-600' : 'text-red-600'}`}>
            {isPositiveVariation ? '+' : ''}{safeVariacaoPercentual.toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Comparação com período anterior
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Funcionários Cobertos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFuncionariosAtivos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Funcionários com plano ativo
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
