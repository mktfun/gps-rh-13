
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, UserX, BarChart3 } from 'lucide-react';

interface FuncionariosKPICardsProps {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosInativos: number;
  taxaCobertura: number;
}

export const FuncionariosKPICards = ({
  totalFuncionarios,
  funcionariosAtivos,
  funcionariosInativos,
  taxaCobertura
}: FuncionariosKPICardsProps) => {
  const formatPercentage = (value: number) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalFuncionarios || 0}</div>
          <p className="text-xs text-muted-foreground">
            Funcionários cadastrados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
          <UserCheck className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{funcionariosAtivos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Com plano de seguro ativo
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Funcionários Inativos</CardTitle>
          <UserX className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{funcionariosInativos || 0}</div>
          <p className="text-xs text-muted-foreground">
            Sem plano ou desligados
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Taxa de Cobertura</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatPercentage(taxaCobertura || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            % funcionários com seguro
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
