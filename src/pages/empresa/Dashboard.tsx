
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaDashboard } from '@/hooks/useEmpresaDashboard';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { useEmpresaEvolucao } from '@/hooks/useEmpresaEvolucao';
import { useEmpresaDistCargos } from '@/hooks/useEmpresaDistCargos';
import { 
  AlertTriangle, 
  Clock, 
  Users, 
  Building2, 
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import ClickableStatCard from '@/components/dashboard/ClickableStatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import CustosPorCnpjChart from '@/components/dashboard/CustosPorCnpjChart';
import EvolucaoMensalChart from '@/components/dashboard/EvolucaoMensalChart';
import DistribuicaoCargosChart from '@/components/dashboard/DistribuicaoCargosChart';
import ActionPriorityCard from '@/components/dashboard/ActionPriorityCard';
import StatusSolicitacoesSection from '@/components/dashboard/StatusSolicitacoesSection';

const EmpresaDashboard = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading: isDashboardLoading, error: dashboardError } = useEmpresaDashboard();
  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } = useEmpresaDashboardMetrics();
  const { data: evolucaoData, isLoading: isEvolucaoLoading } = useEmpresaEvolucao();
  const { data: cargosData, isLoading: isCargosLoading } = useEmpresaDistCargos();
  const [activeTab, setActiveTab] = useState('overview');

  const isLoading = isDashboardLoading || isMetricsLoading;
  const hasError = dashboardError || metricsError;

  // Transform evolucao data for EvolucaoMensalChart
  const evolucaoMensalData = evolucaoData?.map(item => ({
    mes: item.mes,
    funcionarios: item.novos_funcionarios,
    custo: 0 // We don't have cost data from this function
  })) || [];

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
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
              Não foi possível carregar os dados. Tente recarregar a página.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 md:gap-8">
      <div className="max-w-7xl mx-auto space-y-8 w-full">
        {/* Header */}
        <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-4 mb-6">
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

        {/* Seção Status das Suas Solicitações */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
          <StatusSolicitacoesSection 
            solicitacoesPendentes={dashboardData.solicitacoes_pendentes_count}
            funcionariosTravados={dashboardData.funcionarios_travados_count}
          />
        </div>

        {/* Seção Cards de Ação */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-full"></div>
            <h2 className="text-2xl font-bold tracking-tight">Ações Prioritárias</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <ActionPriorityCard
                title="Solicitações Pendentes"
                count={dashboardData.solicitacoes_pendentes_count}
                description="Exclusões aguardando análise da corretora"
                icon={FileText}
                to="/empresa/relatorios/pendencias"
                priority="high"
              />
            </div>
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <ActionPriorityCard
                title="Funcionários Travados"
                count={dashboardData.funcionarios_travados_count}
                description="Pendentes há mais de 5 dias"
                icon={Clock}
                to="/empresa/funcionarios"
                state={{ filter: 'pendente' }}
                priority="medium"
              />
            </div>
          </div>
        </div>

        {/* Indicadores Gerais e Gráficos */}
        {metrics && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="overview">Indicadores Gerais</TabsTrigger>
              <TabsTrigger value="cnpjs">CNPJs / Filiais</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Seção de KPIs */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold tracking-tight">Indicadores Principais</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                    <ClickableStatCard
                      title="Total de Funcionários"
                      value={metrics.totalFuncionarios}
                      description="Clique para gerenciar funcionários"
                      icon={Users}
                      to="/empresa/funcionarios"
                    />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}>
                    <StatCard
                      title="Funcionários Ativos"
                      value={metrics.funcionariosAtivos}
                      description="Funcionários com status ativo"
                      icon={Users}
                    />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
                    <StatCard
                      title="Pendências"
                      value={metrics.funcionariosPendentes}
                      description="Funcionários pendentes"
                      icon={AlertTriangle}
                      className="border-orange-200 hover:border-orange-300"
                    />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '700ms', animationFillMode: 'forwards' }}>
                    <ClickableStatCard
                      title="Total CNPJs"
                      value={metrics.totalCnpjs}
                      description="Clique para ver CNPJs"
                      icon={Building2}
                      onClick={() => setActiveTab('cnpjs')}
                    />
                  </div>
                </div>
              </div>

              {/* Seção de Gráficos Analíticos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold tracking-tight">Análise Mensal</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '800ms', animationFillMode: 'forwards' }}>
                    <EvolucaoMensalChart dados={evolucaoMensalData} />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '900ms', animationFillMode: 'forwards' }}>
                    <DistribuicaoCargosChart dados={cargosData || []} />
                  </div>
                </div>
              </div>

              {/* Seção de Custos */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-2xl font-bold tracking-tight">Indicadores Financeiros</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="lg:col-span-2 animate-fade-in opacity-0" style={{ animationDelay: '1000ms', animationFillMode: 'forwards' }}>
                    <CustosPorCnpjChart dados={metrics.custosPorCnpj} />
                  </div>

                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}>
                    {metrics.planoPrincipal ? (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            Plano Principal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium">Seguradora</h3>
                              <p className="text-muted-foreground">{metrics.planoPrincipal.seguradora}</p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium">Empresa</h3>
                              <p className="text-muted-foreground">{metrics.planoPrincipal.razao_social}</p>
                            </div>
                            <div className="pt-2 border-t">
                              <h3 className="text-sm font-medium">Coberturas</h3>
                              <div className="grid grid-cols-2 gap-2 mt-2">
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
                                    }).format(metrics.planoPrincipal.cobertura_invalidez)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="pt-2 border-t">
                              <h3 className="text-sm font-medium">Valor Mensal</h3>
                              <p className="text-2xl font-bold text-green-600">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL',
                                }).format(metrics.planoPrincipal.valor_mensal)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            Plano Principal
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="py-8 text-center">
                            <p className="text-muted-foreground">
                              Nenhum plano principal configurado
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cnpjs" className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold tracking-tight">CNPJs da Empresa</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
                    <StatCard
                      title="Total de CNPJs"
                      value={metrics.totalCnpjs || 0}
                      description="Filiais cadastradas"
                      icon={Building2}
                    />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                    <StatCard
                      title="Funcionários"
                      value={metrics.totalFuncionarios || 0}
                      description="Em todos os CNPJs"
                      icon={Users}
                    />
                  </div>
                  <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                    <ClickableStatCard
                      title="Relatório de Custos"
                      value="Ver"
                      description="Clique para ver custos por CNPJ"
                      icon={DollarSign}
                      to="/empresa/relatorios/custos"
                    />
                  </div>
                </div>
              </div>

              <Card className="animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Funcionários por CNPJ
                  </CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default EmpresaDashboard;
