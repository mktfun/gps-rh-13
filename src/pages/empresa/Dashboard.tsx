
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaDashboard } from '@/hooks/useEmpresaDashboard';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { 
  AlertTriangle, 
  Users, 
  Building2, 
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import CustosPorCnpjChart from '@/components/dashboard/CustosPorCnpjChart';
import EvolucaoMensalChart from '@/components/dashboard/EvolucaoMensalChart';
import DistribuicaoCargosChart from '@/components/dashboard/DistribuicaoCargosChart';
import StatusSolicitacoesSection from '@/components/dashboard/StatusSolicitacoesSection';
import DashboardCard from '@/components/ui/DashboardCard';

const EmpresaDashboard = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useEmpresaDashboard();
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useEmpresaDashboardMetrics();
  const [activeTab, setActiveTab] = useState('overview');

  console.log('🔍 [EmpresaDashboard] Estado dos dados:', { 
    dashboardData, 
    metrics, 
    isDashboardLoading, 
    isMetricsLoading,
    dashboardError,
    metricsError
  });

  const isLoading = isDashboardLoading || isMetricsLoading;
  const hasError = dashboardError || metricsError;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Painel da Empresa</h1>
              <p className="text-muted-foreground">
                Carregando dados da sua empresa...
              </p>
            </div>
          </div>
          <DashboardLoadingState />
        </div>
      </div>
    );
  }

  if (hasError || !dashboardData) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-1 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Painel da Empresa</h1>
              <p className="text-muted-foreground">
                Erro ao carregar dados do dashboard
              </p>
            </div>
          </div>
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar dados</h3>
            <p className="text-muted-foreground">
              {hasError?.message || 'Não foi possível carregar os dados. Tente recarregar a página.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="max-w-7xl mx-auto space-y-8 w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Painel da Empresa
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Bem-vindo, <span className="font-medium text-blue-600">{user?.email}</span>! 
                Acompanhe o status das suas solicitações e indicadores.
              </p>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <StatusSolicitacoesSection 
            solicitacoesPendentes={dashboardData.solicitacoes_pendentes_count}
            funcionariosTravados={dashboardData.funcionarios_travados_count}
          />
        </div>

        {/* Tabs Navigation */}
        {metrics && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Indicadores Gerais</TabsTrigger>
              <TabsTrigger value="cnpjs">CNPJs / Filiais</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* KPIs Row */}
              <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <DashboardCard
                    title="Total de Funcionários"
                    icon={Users}
                    description="Clique para gerenciar"
                    className="hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => window.location.href = '/empresa/funcionarios'}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {metrics.totalFuncionarios}
                      </div>
                      <p className="text-sm text-muted-foreground">funcionários</p>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Funcionários Ativos"
                    icon={Users}
                    description="Com status ativo"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {metrics.funcionariosAtivos}
                      </div>
                      <p className="text-sm text-muted-foreground">ativos</p>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Pendências"
                    icon={AlertTriangle}
                    description="Funcionários pendentes"
                    className="border-orange-200 hover:border-orange-300"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        {metrics.funcionariosPendentes}
                      </div>
                      <p className="text-sm text-muted-foreground">pendentes</p>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Total CNPJs"
                    icon={Building2}
                    description="Clique para ver CNPJs"
                    className="hover:scale-105 transition-transform cursor-pointer"
                    onClick={() => setActiveTab('cnpjs')}
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {metrics.totalCnpjs}
                      </div>
                      <p className="text-sm text-muted-foreground">filiais</p>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Evolução Mensal */}
                <div className="animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                  <DashboardCard
                    title="Evolução Mensal"
                    icon={TrendingUp}
                    description="Funcionários e custos nos últimos meses"
                  >
                    <EvolucaoMensalChart dados={metrics.evolucaoMensal || []} />
                  </DashboardCard>
                </div>

                {/* Distribuição por Cargos */}
                <div className="animate-fade-in opacity-0" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
                  <DashboardCard
                    title="Distribuição por Cargos"
                    icon={PieChart}
                    description="Funcionários organizados por cargo"
                  >
                    <DistribuicaoCargosChart dados={metrics.distribuicaoCargos || []} />
                  </DashboardCard>
                </div>

                {/* Custos por CNPJ */}
                <div className="animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                  <DashboardCard
                    title="Custos por CNPJ"
                    icon={BarChart3}
                    description="Distribuição de custos por filial"
                  >
                    <CustosPorCnpjChart dados={metrics.custosPorCnpj || []} />
                  </DashboardCard>
                </div>

                {/* Plano Principal */}
                <div className="animate-fade-in opacity-0" style={{ animationDelay: '450ms', animationFillMode: 'forwards' }}>
                  <DashboardCard
                    title="Plano Principal"
                    icon={DollarSign}
                    description="Informações do seu plano ativo"
                  >
                    {metrics.planoPrincipal ? (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Seguradora</h4>
                          <p className="text-lg font-semibold">{metrics.planoPrincipal.seguradora}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground">Empresa</h4>
                          <p className="text-base">{metrics.planoPrincipal.razao_social}</p>
                        </div>
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground mb-3">Coberturas</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Morte</p>
                              <p className="text-lg font-semibold">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(metrics.planoPrincipal.cobertura_morte)}
                              </p>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-xs text-muted-foreground">Invalidez</p>
                              <p className="text-lg font-semibold">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(metrics.planoPrincipal.cobertura_invalidez_acidente)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <h4 className="text-sm font-medium text-muted-foreground">Valor Mensal</h4>
                          <p className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(metrics.planoPrincipal.valor_mensal)}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground">
                          Nenhum plano principal configurado
                        </p>
                      </div>
                    )}
                  </DashboardCard>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cnpjs" className="space-y-8">
              {/* KPIs CNPJs */}
              <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <DashboardCard
                    title="Total de CNPJs"
                    icon={Building2}
                    description="Filiais cadastradas"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {metrics.totalCnpjs || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">filiais</p>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Funcionários"
                    icon={Users}
                    description="Em todos os CNPJs"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        {metrics.totalFuncionarios || 0}
                      </div>
                      <p className="text-sm text-muted-foreground">funcionários</p>
                    </div>
                  </DashboardCard>

                  <DashboardCard
                    title="Custo Total"
                    icon={DollarSign}
                    description="Valor mensal total"
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(metrics.custoMensalTotal || 0)}
                      </div>
                      <p className="text-sm text-muted-foreground">mensal</p>
                    </div>
                  </DashboardCard>
                </div>
              </div>

              {/* Lista de CNPJs */}
              <div className="animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <DashboardCard
                  title="Funcionários por CNPJ"
                  icon={Building2}
                  description="Distribuição de funcionários por filial"
                >
                  {!metrics.custosPorCnpj || metrics.custosPorCnpj.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum CNPJ cadastrado</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {metrics.custosPorCnpj.map((cnpj, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <h3 className="font-medium">{cnpj.razao_social}</h3>
                            <p className="text-sm text-muted-foreground">
                              CNPJ: {cnpj.cnpj}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="outline" className="bg-blue-50">
                              {cnpj.funcionarios_count} funcionários
                            </Badge>
                            <Badge variant="outline" className="bg-green-50">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(cnpj.valor_mensal)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </DashboardCard>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default EmpresaDashboard;
