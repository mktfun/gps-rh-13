import React, { useState, useMemo } from 'react';
import { RefreshCw, Users, Building2, DollarSign, AlertTriangle, TrendingUp, PieChart, ArrowRight, ExternalLink, BarChart3, Calendar, Filter, ZoomIn } from 'lucide-react';
import { PieChart as RechartsPieChart, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { Pie } from 'recharts';

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

function AnalyticsCard({ data }: { data: any }) {
  const [activeChart, setActiveChart] = useState<'cargos' | 'evolucao'>('cargos');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [dateRange, setDateRange] = useState(30); // days

  // Pie chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  // Generate real-time analysis for cargos
  const cargosAnalysis = useMemo(() => {
    if (!data.distribuicaoCargos || data.distribuicaoCargos.length === 0) return '';

    const topCargo = data.distribuicaoCargos[0];
    const totalCargos = data.distribuicaoCargos.length;
    const percentage = ((topCargo.count / data.totalFuncionarios) * 100).toFixed(1);

    return `${topCargo.cargo} representa ${percentage}% dos funcionários (${topCargo.count} de ${data.totalFuncionarios}). Total de ${totalCargos} cargos diferentes identificados.`;
  }, [data.distribuicaoCargos, data.totalFuncionarios]);

  // Generate real-time analysis for evolution
  const evolucaoAnalysis = useMemo(() => {
    if (!data.evolucaoMensal || data.evolucaoMensal.length < 2) return '';

    const recent = data.evolucaoMensal[data.evolucaoMensal.length - 1];
    const previous = data.evolucaoMensal[data.evolucaoMensal.length - 2];
    const funcionarioChange = recent.funcionarios - previous.funcionarios;
    const custoChange = recent.custo - previous.custo;
    const trend = funcionarioChange > 0 ? 'crescimento' : funcionarioChange < 0 ? 'redução' : 'estabilidade';

    return `${trend === 'crescimento' ? '📈' : trend === 'redução' ? '📉' : '➡️'} ${trend} de ${Math.abs(funcionarioChange)} funcionários e ${custoChange >= 0 ? 'aumento' : 'redução'} de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(custoChange))} no último mês.`;
  }, [data.evolucaoMensal]);

  // Prepare pie chart data
  const pieChartData = data.distribuicaoCargos?.map((cargo: any, index: number) => ({
    name: cargo.cargo,
    value: cargo.count,
    percentage: ((cargo.count / data.totalFuncionarios) * 100).toFixed(1)
  })) || [];

  // Filter evolution data based on date range
  const filteredEvolutionData = useMemo(() => {
    if (!data.evolucaoMensal) return [];
    return data.evolucaoMensal.slice(-Math.ceil(dateRange / 30)); // Approximate months based on days
  }, [data.evolucaoMensal, dateRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeChart === 'cargos' ? (
              <PieChart className="h-5 w-5 text-blue-600" />
            ) : (
              <TrendingUp className="h-5 w-5 text-blue-600" />
            )}
            <CardTitle>
              {activeChart === 'cargos' ? 'Distribuição por Cargos' : 'Evolução Mensal'}
            </CardTitle>
          </div>

          <div className="inline-flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveChart('cargos')}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeChart === 'cargos'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="mr-1.5 h-3 w-3" />
              Cargos
            </button>
            <button
              onClick={() => setActiveChart('evolucao')}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeChart === 'evolucao'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="mr-1.5 h-3 w-3" />
              Evolução
            </button>
          </div>
        </div>

        <CardDescription>
          {activeChart === 'cargos'
            ? 'Distribuição visual dos cargos da empresa'
            : 'Evolução temporal com filtros personalizáveis'
          }
        </CardDescription>

        {activeChart === 'evolucao' && (
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1 bg-white"
              >
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={180}>Últimos 6 meses</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  chartType === 'bar' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  chartType === 'line' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {activeChart === 'cargos' ? (
          <div className="space-y-6">
            {/* Pie Chart */}
            <div className="h-80">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={40}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieChartData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, props: any) => [
                        `${value} funcionários (${props.payload.percentage}%)`,
                        props.payload.name
                      ]}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color, fontSize: '12px' }}>
                          {value}
                        </span>
                      )}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <ZoomIn className="h-8 w-8 mr-2" />
                  Nenhum dado disponível para visualização
                </div>
              )}
            </div>

            {/* Real-time Analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">Análise em Tempo Real</h4>
                  <p className="text-sm text-blue-800">
                    {cargosAnalysis || 'Aguardando dados para análise...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Chart */}
            <div className="h-80">
              {filteredEvolutionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={filteredEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="mes"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="funcionarios"
                        orientation="left"
                        stroke="#3b82f6"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="custo"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={12}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'funcionarios') return [value, 'Funcionários'];
                          return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Custo'];
                        }}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="funcionarios"
                        dataKey="funcionarios"
                        fill="#3b82f6"
                        name="Funcionários"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="custo"
                        dataKey="custo"
                        fill="#10b981"
                        name="Custo (R$)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={filteredEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="mes"
                        stroke="#6b7280"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="funcionarios"
                        orientation="left"
                        stroke="#3b82f6"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="custo"
                        orientation="right"
                        stroke="#10b981"
                        fontSize={12}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'funcionarios') return [value, 'Funcionários'];
                          return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Custo'];
                        }}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line
                        yAxisId="funcionarios"
                        type="monotone"
                        dataKey="funcionarios"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Funcionários"
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="custo"
                        type="monotone"
                        dataKey="custo"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Custo (R$)"
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <TrendingUp className="h-8 w-8 mr-2" />
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </div>

            {/* Real-time Analysis */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-medium text-green-900 mb-1">Análise em Tempo Real</h4>
                  <p className="text-sm text-green-800">
                    {evolucaoAnalysis || 'Aguardando dados para análise...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
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
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-500 shadow-sm">
            <TabsTrigger
              value="overview"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="cnpjs"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              <Building2 className="mr-2 h-4 w-4" />
              CNPJs
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Análises
            </TabsTrigger>
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
            <AnalyticsCard data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
