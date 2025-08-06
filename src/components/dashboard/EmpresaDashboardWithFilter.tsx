
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Users, Building2, TrendingUp, PieChart } from "lucide-react";
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import StatCard from './StatCard';
import CustoTotalCard from './CustoTotalCard';
import EvolucaoMensalChart from './EvolucaoMensalChart';
import DistribuicaoCargosChart from './DistribuicaoCargosChart';
import PlanoInfoCard from './PlanoInfoCard';
import CustosPorCnpjChart from './CustosPorCnpjChart';

const EmpresaDashboardWithFilter = () => {
  const [timePeriod, setTimePeriod] = useState<number>(6);
  
  const { data: metrics, isLoading, error } = useEmpresaDashboardMetrics(timePeriod);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar dados do dashboard: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return null;
  }

  const timePeriodText = timePeriod === 6 ? '6' : '12';

  return (
    <div className="space-y-6 p-6">
      {/* Header com filtro */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel da Empresa</h1>
          <p className="text-muted-foreground">
            Visão completa dos seus funcionários e custos de planos
          </p>
        </div>
        <Select value={timePeriod.toString()} onValueChange={(value) => setTimePeriod(parseInt(value))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">Últimos 6 Meses</SelectItem>
            <SelectItem value="12">Últimos 12 Meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de CNPJs"
          value={metrics.totalCnpjs.toString()}
          icon={Building2}
        />
        <StatCard
          title="Total de Funcionários"
          value={metrics.totalFuncionarios.toString()}
          icon={Users}
        />
        <StatCard
          title="Funcionários Ativos"
          value={metrics.funcionariosAtivos.toString()}
          icon={Users}
          variant="success"
        />
        <StatCard
          title="Funcionários Pendentes"
          value={metrics.funcionariosPendentes.toString()}
          icon={Users}
          variant="warning"
        />
      </div>

      {/* Grid principal dos cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card de Custo Total */}
        <CustoTotalCard 
          valor={metrics.custoMensalTotal}
        />

        {/* Card do Plano Principal */}
        <PlanoInfoCard 
          plano={metrics.planoPrincipal}
        />

        {/* Card de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolução Mensal
            </CardTitle>
            <CardDescription>
              Análise de novas contratações e custos de planos nos últimos {timePeriodText} meses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EvolucaoMensalChart dados={metrics.evolucaoMensal} />
          </CardContent>
        </Card>

        {/* Card Unificado de Análise de Distribuição com Abas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Análise de Distribuição
            </CardTitle>
            <CardDescription>
              Visão detalhada da composição de seus funcionários e custos por unidade de negócio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="cargos" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cargos">Por Cargo</TabsTrigger>
                <TabsTrigger value="cnpj">Por CNPJ</TabsTrigger>
              </TabsList>
              <TabsContent value="cargos" className="mt-4">
                <DistribuicaoCargosChart dados={metrics.distribuicaoCargos} />
              </TabsContent>
              <TabsContent value="cnpj" className="mt-4">
                <CustosPorCnpjChart dados={metrics.custosPorCnpj} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmpresaDashboardWithFilter;
