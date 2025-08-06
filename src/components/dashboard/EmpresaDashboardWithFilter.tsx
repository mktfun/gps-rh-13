
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { TimePeriodFilter } from './TimePeriodFilter';
import StatCard from './StatCard';
import CustoTotalCard from './CustoTotalCard';
import EvolucaoMensalChart from './EvolucaoMensalChart';
import DistribuicaoCargosChart from './DistribuicaoCargosChart';
import PlanoInfoCard from './PlanoInfoCard';
import CustosPorCnpjChart from './CustosPorCnpjChart';
import { Users, Building2, UserCheck, UserCog } from 'lucide-react';

export const EmpresaDashboardWithFilter = () => {
  const [timePeriod, setTimePeriod] = useState(6);
  
  const { data: metrics, isLoading, error } = useEmpresaDashboardMetrics(timePeriod);

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">Erro ao carregar dados do dashboard</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard da Empresa</h1>
          <div className="animate-pulse bg-muted h-10 w-40 rounded"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-muted h-24 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtro */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard da Empresa</h1>
          <p className="text-muted-foreground">
            Visão geral dos seus dados para os {timePeriod === 6 ? 'últimos 6 meses' : 'últimos 12 meses'}
          </p>
        </div>
        <TimePeriodFilter 
          value={timePeriod} 
          onChange={setTimePeriod}
        />
      </div>

      {/* KPIs principais */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="CNPJs Ativos"
          value={metrics?.totalCnpjs || 0}
          icon={Building2}
          description="Total de unidades ativas"
        />
        
        <StatCard
          title="Total de Funcionários"
          value={metrics?.totalFuncionarios || 0}
          icon={Users}
          description="Funcionários ativos e pendentes"
        />
        
        <StatCard
          title="Funcionários Ativos"
          value={metrics?.funcionariosAtivos || 0}
          icon={UserCheck}
          description="Com seguro ativo"
          trend={{ value: 5.2, isPositive: true }}
        />
        
        <StatCard
          title="Pendentes"
          value={metrics?.funcionariosPendentes || 0}
          icon={UserCog}
          description="Aguardando ativação"
          variant="warning"
        />
      </div>

      {/* Custo Total */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustoTotalCard 
            valor={metrics?.custoMensalTotal || 0}
            periodo={`${timePeriod} meses`}
          />
        </div>
        
        <PlanoInfoCard plano={metrics?.planoPrincipal} />
      </div>

      {/* Gráficos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <p className="text-sm text-muted-foreground">
              Novos funcionários e custos dos últimos {timePeriod} meses
            </p>
          </CardHeader>
          <CardContent>
            <EvolucaoMensalChart dados={metrics?.evolucaoMensal || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Cargo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Top 5 cargos mais comuns
            </p>
          </CardHeader>
          <CardContent>
            <DistribuicaoCargosChart dados={metrics?.distribuicaoCargos || []} />
          </CardContent>
        </Card>
      </div>

      {/* Custos por CNPJ */}
      <Card>
        <CardHeader>
          <CardTitle>Custos por CNPJ</CardTitle>
          <p className="text-sm text-muted-foreground">
            Distribuição de custos entre suas unidades
          </p>
        </CardHeader>
        <CardContent>
          <CustosPorCnpjChart dados={metrics?.custosPorCnpj || []} />
        </CardContent>
      </Card>
    </div>
  );
};
