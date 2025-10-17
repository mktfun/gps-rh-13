import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, UserCheck, UserPlus, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { Skeleton } from '@/components/ui/skeleton';

interface PlanoVisaoGeralTabProps {
  planoId: string;
}

export default function PlanoVisaoGeralTab({ planoId }: PlanoVisaoGeralTabProps) {
  const { data: planoDetalhes, isLoading: isLoadingPlano } = usePlanoDetalhes(planoId);
  const { data: stats, isLoading: isLoadingStats } = usePlanoFuncionariosStats(
    planoId, 
    planoDetalhes?.tipo_seguro || 'vida',
    planoDetalhes?.valor_mensal_calculado || planoDetalhes?.valor_mensal || 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoadingPlano || isLoadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const tipoSeguro = planoDetalhes?.tipo_seguro || 'vida';
  const valorMensal = planoDetalhes?.valor_mensal_calculado || planoDetalhes?.valor_mensal || 0;

  return (
    <div className="space-y-6">
      {/* Header com informações do plano */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6" />
                {planoDetalhes?.seguradora || 'Seguradora'}
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                {planoDetalhes?.cnpj_razao_social} ({planoDetalhes?.cnpj_numero})
              </p>
            </div>
            <Badge variant={tipoSeguro === 'saude' ? 'default' : 'secondary'} className="text-sm">
              {tipoSeguro === 'saude' ? 'Plano de Saúde' : 'Seguro de Vida'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Valor Mensal Total</p>
              <p className="text-2xl font-bold">{formatCurrency(valorMensal)}</p>
            </div>
            {tipoSeguro === 'vida' && (
              <div>
                <p className="text-sm text-muted-foreground">Cobertura Morte</p>
                <p className="text-2xl font-bold">{formatCurrency(planoDetalhes?.cobertura_morte || 0)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPIs de Funcionários */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">vinculados ao plano</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.ativos || 0}</div>
            <p className="text-xs text-muted-foreground">funcionários ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <UserPlus className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</div>
            <p className="text-xs text-muted-foreground">aguardando ativação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Médio</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.salarioMedio || 0)}</div>
            <p className="text-xs text-muted-foreground">dos funcionários</p>
          </CardContent>
        </Card>
      </div>

      {/* Coberturas adicionais para Seguro de Vida */}
      {tipoSeguro === 'vida' && planoDetalhes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Coberturas Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Morte Acidental</p>
                <p className="text-lg font-semibold">{formatCurrency(planoDetalhes.cobertura_morte_acidental)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Invalidez por Acidente</p>
                <p className="text-lg font-semibold">{formatCurrency(planoDetalhes.cobertura_invalidez_acidente)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Auxílio Funeral</p>
                <p className="text-lg font-semibold">{formatCurrency(planoDetalhes.cobertura_auxilio_funeral)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}