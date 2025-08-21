import React, { useState } from 'react';
import { RefreshCw, Users, Building2, DollarSign, AlertTriangle, TrendingUp, PieChart, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/ui/ErrorState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/badge';

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
  actionText?: string;
  isClickable?: boolean;
}

function KPICard({ title, value, description, icon, trend, trendValue, bgColor = 'bg-white', textColor = 'text-gray-900', onClick, actionText, isClickable = false }: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className={`${bgColor} border transition-all duration-200 ${
      isClickable
        ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-blue-300 group'
        : 'hover:shadow-md'
    }`} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className={`text-sm font-medium ${textColor}`}>
          {title}
        </CardTitle>
        <div className={`${isClickable ? 'text-blue-600 group-hover:text-blue-700' : 'text-blue-600'} relative`}>
          {icon}
          {isClickable && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-2 w-2 text-blue-600" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${textColor} mb-1`}>
          {typeof value === 'number' && title.includes('Custo')
            ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value)
            : value
          }
        </div>
        <p className="text-xs text-gray-600 mb-2">
          {description}
        </p>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
        {isClickable && actionText && (
          <div className="flex items-center gap-1 text-xs text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3" />
            <span>{actionText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useEmpresaDashboardMetrics();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('🏢 [DashboardPage] Dados recebidos:', { data, isLoading, error });

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['empresa-dashboard-metrics'] });
      await refetch();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard da Empresa</h1>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ErrorState
          title="Erro ao carregar dashboard"
          message={typeof error === 'string' ? error : 'Erro desconhecido'}
          onRetry={handleRefreshData}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <ErrorState 
            title="Nenhum dado encontrado"
            description="Não há dados disponíveis para esta empresa no momento."
            onRetry={handleRefreshData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="max-w-7xl mx-auto space-y-8 w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Dashboard da Empresa
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                Visão geral dos indicadores principais
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshData}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            {isRefreshing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title="Total de Funcionários"
            value={data.totalFuncionarios || 0}
            description="Funcionários cadastrados"
            icon={<Users className="h-5 w-5" />}
            isClickable={true}
            actionText="Ver funcionários"
            onClick={() => navigate('/empresa/funcionarios')}
            bgColor="bg-gradient-to-br from-blue-50 to-indigo-50"
            textColor="text-blue-900"
          />

          <KPICard
            title="CNPJs Ativos"
            value={data.totalCnpjs || 0}
            description="Empresas vinculadas"
            icon={<Building2 className="h-5 w-5" />}
            bgColor="bg-gradient-to-br from-gray-50 to-slate-50"
            textColor="text-gray-700"
          />

          <KPICard
            title="Custo Total Estimado"
            value={data.custoMensalTotal || 0}
            description="Valor mensal dos planos"
            icon={<DollarSign className="h-5 w-5" />}
            isClickable={true}
            actionText="Ver relatório de custos"
            onClick={() => navigate('/empresa/relatorios/custos-detalhado')}
            bgColor="bg-gradient-to-br from-green-50 to-emerald-50"
            textColor="text-green-900"
          />

          <KPICard
            title="Pendências"
            value={data.funcionariosPendentes || 0}
            description="Itens aguardando processamento"
            icon={<AlertTriangle className="h-5 w-5" />}
            isClickable={true}
            actionText="Ver relatório de pendências"
            onClick={() => navigate('/empresa/relatorios/pendencias')}
            bgColor={data.funcionariosPendentes > 0 ? "bg-gradient-to-br from-yellow-50 to-orange-50" : "bg-gradient-to-br from-gray-50 to-slate-50"}
            textColor={data.funcionariosPendentes > 0 ? "text-yellow-900" : "text-gray-700"}
          />
        </div>

        {/* Seções Detalhadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cnpjs">CNPJs</TabsTrigger>
            <TabsTrigger value="analytics">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status dos Funcionários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Status dos Funcionários
                </CardTitle>
                <CardDescription>
                  Distribuição atual dos funcionários por status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-green-900">Funcionários Ativos</p>
                      <p className="text-2xl font-bold text-green-700">{data.funcionariosAtivos || 0}</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {data.totalFuncionarios > 0 
                        ? `${Math.round((data.funcionariosAtivos / data.totalFuncionarios) * 100)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Funcionários Pendentes</p>
                      <p className="text-2xl font-bold text-yellow-700">{data.funcionariosPendentes || 0}</p>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {data.totalFuncionarios > 0 
                        ? `${Math.round((data.funcionariosPendentes / data.totalFuncionarios) * 100)}%`
                        : '0%'
                      }
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plano Principal */}
            {data.planoPrincipal && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Plano Principal
                  </CardTitle>
                  <CardDescription>
                    Informações do plano com maior valor
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Seguradora</p>
                      <p className="text-lg font-semibold text-gray-900">{data.planoPrincipal.seguradora}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Empresa</p>
                      <p className="text-base text-gray-900">{data.planoPrincipal.razao_social}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valor Mensal</p>
                      <p className="text-xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(data.planoPrincipal.valor_mensal)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Cobertura Morte</p>
                      <p className="text-base font-medium text-gray-900">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(data.planoPrincipal.cobertura_morte || 0)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cnpjs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Custos por CNPJ
                </CardTitle>
                <CardDescription>
                  Detalhamento dos custos e funcionários por empresa
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.custosPorCnpj && data.custosPorCnpj.length > 0 ? (
                  <div className="space-y-4">
                    {data.custosPorCnpj.map((cnpj, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cnpj.razao_social}</p>
                          <p className="text-sm text-gray-600">CNPJ: {cnpj.cnpj}</p>
                          <p className="text-sm text-blue-600">{cnpj.funcionarios_count} funcionários</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(cnpj.valor_mensal)}
                          </p>
                          <p className="text-sm text-gray-500">por mês</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Nenhum CNPJ com dados encontrado
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Distribuição por Cargos */}
            {data.distribuicaoCargos && data.distribuicaoCargos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-blue-600" />
                    Distribuição por Cargos
                  </CardTitle>
                  <CardDescription>
                    Top 5 cargos mais comuns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.distribuicaoCargos.map((cargo, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{cargo.cargo}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min((cargo.count / data.totalFuncionarios) * 100, 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-900 w-8 text-right">{cargo.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evolução Mensal */}
            {data.evolucaoMensal && data.evolucaoMensal.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    Evolução Mensal
                  </CardTitle>
                  <CardDescription>
                    Histórico dos últimos 6 meses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.evolucaoMensal.map((mes, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{mes.mes}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-blue-600">{mes.funcionarios} funcionários</span>
                          <span className="text-sm font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(mes.custo)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
