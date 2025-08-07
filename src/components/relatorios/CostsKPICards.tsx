
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
    }).format(value);
  };

  const isPositiveVariation = variacaoPercentual >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Custo Total no Período</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(custoTotalPeriodo)}</div>
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
          <div className="text-2xl font-bold">{formatCurrency(custoMedioFuncionario)}</div>
          <p className="text-xs text-muted-foreground">
            Baseado em {totalFuncionariosAtivos} funcionários ativos
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
            {isPositiveVariation ? '+' : ''}{variacaoPercentual.toFixed(1)}%
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
          <div className="text-2xl font-bold">{totalFuncionariosAtivos}</div>
          <p className="text-xs text-muted-foreground">
            Funcionários com plano ativo
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
