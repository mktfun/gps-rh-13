import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, Users, Building2, DollarSign, AlertTriangle, TrendingUp, PieChart, BarChart3, Calendar, Filter, CheckCircle, Clock, Activity, Shield, Star, ExternalLink } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, LineChart, Line } from 'recharts';
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

interface KPICardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  onClick?: () => void;
  actionText?: string;
  isClickable?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function AnalyticsCard({ data }: { data: any }) {
  const [activeChart, setActiveChart] = useState<'cargos' | 'evolucao'>('cargos');
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [dateRange, setDateRange] = useState(30); // days

  // Pie chart colors using design system colors
  const COLORS = [
    'hsl(var(--primary))', 
    'hsl(var(--corporate-green))', 
    'hsl(var(--corporate-orange))', 
    'hsl(var(--destructive))', 
    'hsl(var(--corporate-blue))', 
    'hsl(var(--accent))', 
    'hsl(var(--secondary))'
  ];

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
              <PieChart className="h-5 w-5 text-primary" />
            ) : (
              <TrendingUp className="h-5 w-5 text-primary" />
            )}
            <CardTitle>
              {activeChart === 'cargos' ? 'Distribuição por Cargos' : 'Evolução Mensal'}
            </CardTitle>
          </div>

          <div className="inline-flex rounded-lg bg-muted p-1">
            <button
              onClick={() => setActiveChart('cargos')}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeChart === 'cargos'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart3 className="mr-1.5 h-3 w-3" />
              Cargos
            </button>
            <button
              onClick={() => setActiveChart('evolucao')}
              className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeChart === 'evolucao'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
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
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(Number(e.target.value))}
                className="text-sm border rounded px-2 py-1 bg-background text-foreground"
              >
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
                <option value={90}>Últimos 90 dias</option>
                <option value={180}>Últimos 6 meses</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-muted rounded p-1">
              <button
                onClick={() => setChartType('bar')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  chartType === 'bar' ? 'bg-background shadow-sm' : 'hover:bg-muted-foreground/10'
                }`}
              >
                <BarChart3 className="h-3 w-3" />
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  chartType === 'line' ? 'bg-background shadow-sm' : 'hover:bg-muted-foreground/10'
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
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <PieChart className="h-8 w-8 mr-2" />
                  Nenhum dado disponível para visualização
                </div>
              )}
            </div>

            {/* Real-time Analysis */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-medium text-primary mb-1">Análise em Tempo Real</h4>
                  <p className="text-sm text-primary/80">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="mes"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="funcionarios"
                        orientation="left"
                        stroke="hsl(var(--primary))"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="custo"
                        orientation="right"
                        stroke="hsl(var(--corporate-green))"
                        fontSize={12}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'funcionarios') return [value, 'Funcionários'];
                          return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Custo'];
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Bar
                        yAxisId="funcionarios"
                        dataKey="funcionarios"
                        fill="hsl(var(--primary))"
                        name="Funcionários"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="custo"
                        dataKey="custo"
                        fill="hsl(var(--corporate-green))"
                        name="Custo (R$)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  ) : (
                    <LineChart data={filteredEvolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="mes"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="funcionarios"
                        orientation="left"
                        stroke="hsl(var(--primary))"
                        fontSize={12}
                      />
                      <YAxis
                        yAxisId="custo"
                        orientation="right"
                        stroke="hsl(var(--corporate-green))"
                        fontSize={12}
                        tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'funcionarios') return [value, 'Funcionários'];
                          return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Custo'];
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))', 
                          border: '1px solid hsl(var(--border))', 
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Legend />
                      <Line
                        yAxisId="funcionarios"
                        type="monotone"
                        dataKey="funcionarios"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        name="Funcionários"
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                      <Line
                        yAxisId="custo"
                        type="monotone"
                        dataKey="custo"
                        stroke="hsl(var(--corporate-green))"
                        strokeWidth={3}
                        name="Custo (R$)"
                        dot={{ fill: 'hsl(var(--corporate-green))', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: 'hsl(var(--corporate-green))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <TrendingUp className="h-8 w-8 mr-2" />
                  Nenhum dado disponível para o período selecionado
                </div>
              )}
            </div>

            {/* Real-time Analysis */}
            <div className="bg-corporate-green/10 border border-corporate-green/20 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-corporate-green rounded-full mt-2 animate-pulse"></div>
                <div>
                  <h4 className="text-sm font-medium text-corporate-green mb-1">Análise em Tempo Real</h4>
                  <p className="text-sm text-corporate-green/80">
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

function KPICard({ 
  title, 
  value, 
  description, 
  icon, 
  trend, 
  trendValue, 
  onClick, 
  actionText, 
  isClickable = false, 
  variant = 'default' 
}: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-corporate-green" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-corporate-green';
      case 'down': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-corporate-green/20 bg-corporate-green/5';
      case 'warning':
        return 'border-corporate-orange/20 bg-corporate-orange/5';
      case 'destructive':
        return 'border-destructive/20 bg-destructive/5';
      default:
        return 'border-border bg-card';
    }
  };

  return (
    <Card 
      className={`${getVariantStyles()} transition-all duration-200 ${
        isClickable
          ? 'hover:shadow-lg hover:scale-[1.02] cursor-pointer hover:border-primary/50 group'
          : 'hover:shadow-md'
      }`} 
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-foreground">
          {title}
        </CardTitle>
        <div className={`${isClickable ? 'text-primary group-hover:text-primary/80' : 'text-primary'} relative`}>
          {icon}
          {isClickable && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <ExternalLink className="h-2 w-2 text-primary" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-foreground mb-1">
          {typeof value === 'number' && title.includes('Custo')
            ? new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(value)
            : value
          }
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {description}
        </p>
        {trend && trendValue && (
          <div className={`flex items-center space-x-1 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendValue}</span>
          </div>
        )}
        {isClickable && actionText && (
          <div className="flex items-center gap-1 text-xs text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="h-3 w-3" />
            <span>{actionText}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, empresaId } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // SEGURANÇA CRÍTICA: Usar o ID real da empresa do usuário logado
  const realEmpresaId = empresaId || user?.empresa_id || user?.id;
  const { data, isLoading, error, refetch } = useEmpresaDashboardMetrics();

  // Log de segurança para verificar o ID usado
  console.log('🔐 [DashboardPage] IDs de segurança:', {
    empresaId,
    userId: user?.id,
    userEmpresaId: user?.empresa_id,
    realEmpresaId,
    userRole: user?.role
  });

  // Log detalhado dos dados recebidos
  console.log('🏢 [DashboardPage] Hook resultado:', {
    data: data,
    isLoading,
    error,
    empresaId: realEmpresaId
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update timestamp every minute for real-time feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Real-time insights
  const statusInsights = useMemo(() => {
    if (!data) return '';
    const activeRate = data.totalFuncionarios > 0
      ? (data.funcionariosAtivos / data.totalFuncionarios * 100).toFixed(1)
      : 0;

    if (parseFloat(activeRate as string) === 100) {
      return '🎯 Excelente! Todos os funcionários estão ativos.';
    } else if (parseFloat(activeRate as string) >= 90) {
      return `✅ Ótima situação com ${activeRate}% dos funcionários ativos.`;
    } else if (parseFloat(activeRate as string) >= 70) {
      return `⚠️ ${data.funcionariosPendentes} funcionários pendentes requerem atenção.`;
    } else {
      return `🚨 Alta concentração de pendências (${data.funcionariosPendentes} funcionários).`;
    }
  }, [data]);

  const planoInsights = useMemo(() => {
    if (!data?.planoPrincipal) return '';
    const valorAnual = data.planoPrincipal.valor_mensal * 12;
    const cobertura = data.planoPrincipal.cobertura_morte || 0;
    const ratio = cobertura > 0 ? (cobertura / data.planoPrincipal.valor_mensal).toFixed(0) : 0;

    return `💰 Investimento anual de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorAnual)} | Cobertura ${ratio}x o valor mensal`;
  }, [data?.planoPrincipal]);

  console.log('🏢 [DashboardPage] Dados recebidos:', { data, isLoading, error });
  console.log('🏢 [DashboardPage] Dados detalhados:', {
    hasData: !!data,
    totalFuncionarios: data?.totalFuncionarios,
    funcionariosAtivos: data?.funcionariosAtivos,
    custoMensalTotal: data?.custoMensalTotal,
    totalCnpjs: data?.totalCnpjs,
    custosPorCnpjLength: data?.custosPorCnpj?.length,
    dataKeys: data ? Object.keys(data) : 'no data'
  });

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
            <div className="h-12 w-1 bg-primary rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard da Empresa</h1>
              <p className="text-muted-foreground">Carregando dados...</p>
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
            <div className="h-12 w-1 bg-primary rounded-full"></div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">
                Dashboard da Empresa
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
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
            variant="default"
          />

          <KPICard
            title="CNPJs Ativos"
            value={data.totalCnpjs || 0}
            description="Empresas vinculadas"
            icon={<Building2 className="h-5 w-5" />}
            variant="default"
          />

          <KPICard
            title="Custo Total Estimado"
            value={data.custoMensalTotal || 0}
            description="Valor mensal dos planos"
            icon={<DollarSign className="h-5 w-5" />}
            isClickable={true}
            actionText="Ver relatório de custos"
            onClick={() => navigate('/empresa/relatorios/custos-detalhado')}
            variant="success"
          />

          <KPICard
            title="Pendências"
            value={data.funcionariosPendentes || 0}
            description="Itens aguardando processamento"
            icon={<AlertTriangle className="h-5 w-5" />}
            isClickable={true}
            actionText="Ver relatório de pendências"
            onClick={() => navigate('/empresa/relatorios/pendencias')}
            variant={data.funcionariosPendentes > 0 ? "warning" : "success"}
          />
        </div>

        {/* Seções Detalhadas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted p-1 text-muted-foreground">
            <TabsTrigger
              value="overview"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="cnpjs"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <Building2 className="mr-2 h-4 w-4" />
              CNPJs
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-6 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Status dos Funcionários */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-foreground">
                        Status dos Funcionários
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        Distribuição atual por status
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Activity className="h-3 w-3 animate-pulse text-corporate-green" />
                    Atualizado há {Math.floor((Date.now() - lastUpdate.getTime()) / 60000)}min
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Funcionários Ativos */}
                  <Card className="border-corporate-green/20 bg-corporate-green/5">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-corporate-green/20 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-corporate-green" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-corporate-green">Funcionários Ativos</p>
                            <p className="text-xs text-corporate-green/80">Status confirmado</p>
                          </div>
                        </div>
                        <Badge className="bg-corporate-green/20 text-corporate-green border-corporate-green/20">
                          {data.totalFuncionarios > 0
                            ? `${Math.round((data.funcionariosAtivos / data.totalFuncionarios) * 100)}%`
                            : '0%'
                          }
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className="text-3xl font-bold text-corporate-green">{data.funcionariosAtivos || 0}</p>
                        <div className="text-right">
                          <p className="text-xs text-corporate-green/80 font-medium">De {data.totalFuncionarios}</p>
                          <div className="w-16 h-1.5 bg-corporate-green/20 rounded-full overflow-hidden mt-1">
                            <div
                              className="h-full bg-corporate-green rounded-full transition-all duration-500"
                              style={{
                                width: data.totalFuncionarios > 0
                                  ? `${(data.funcionariosAtivos / data.totalFuncionarios) * 100}%`
                                  : '0%'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Funcionários Pendentes */}
                  <Card className={`${data.funcionariosPendentes > 0 ? 'border-corporate-orange/20 bg-corporate-orange/5' : 'border-corporate-green/20 bg-corporate-green/5'}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${data.funcionariosPendentes > 0 ? 'bg-corporate-orange/20' : 'bg-corporate-green/20'}`}>
                            <Clock className={`h-4 w-4 ${data.funcionariosPendentes > 0 ? 'text-corporate-orange' : 'text-corporate-green'}`} />
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${data.funcionariosPendentes > 0 ? 'text-corporate-orange' : 'text-corporate-green'}`}>Funcionários Pendentes</p>
                            <p className={`text-xs ${data.funcionariosPendentes > 0 ? 'text-corporate-orange/80' : 'text-corporate-green/80'}`}>Aguardando processamento</p>
                          </div>
                        </div>
                        <Badge className={`${data.funcionariosPendentes > 0 ? 'bg-corporate-orange/20 text-corporate-orange border-corporate-orange/20' : 'bg-corporate-green/20 text-corporate-green border-corporate-green/20'}`}>
                          {data.totalFuncionarios > 0
                            ? `${Math.round((data.funcionariosPendentes / data.totalFuncionarios) * 100)}%`
                            : '0%'
                          }
                        </Badge>
                      </div>
                      <div className="flex items-end justify-between">
                        <p className={`text-3xl font-bold ${data.funcionariosPendentes > 0 ? 'text-corporate-orange' : 'text-corporate-green'}`}>{data.funcionariosPendentes || 0}</p>
                        <div className="text-right">
                          <p className={`text-xs font-medium ${data.funcionariosPendentes > 0 ? 'text-corporate-orange/80' : 'text-corporate-green/80'}`}>De {data.totalFuncionarios}</p>
                          <div className={`w-16 h-1.5 rounded-full overflow-hidden mt-1 ${data.funcionariosPendentes > 0 ? 'bg-corporate-orange/20' : 'bg-corporate-green/20'}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${data.funcionariosPendentes > 0 ? 'bg-corporate-orange' : 'bg-corporate-green'}`}
                              style={{
                                width: data.totalFuncionarios > 0
                                  ? `${(data.funcionariosPendentes / data.totalFuncionarios) * 100}%`
                                  : '0%'
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Real-time Insight */}
                <div className="mt-6 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium text-primary">Análise em Tempo Real</span>
                  </div>
                  <p className="text-sm text-primary/80 mt-1">{statusInsights}</p>
                </div>
              </CardContent>
            </Card>

            {/* Plano Principal */}
            {data.planoPrincipal && (
              <Card>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          Plano Principal
                        </CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          Plano com maior valor da carteira
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-corporate-green/20 text-corporate-green border-corporate-green/20">
                      Ativo
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Header com Seguradora */}
                  <div className="mb-6 p-4 bg-muted rounded-xl border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Seguradora</p>
                        <p className="text-xl font-bold text-foreground">{data.planoPrincipal.seguradora}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Empresa</p>
                        <p className="text-base font-semibold text-foreground max-w-48 truncate">
                          {data.planoPrincipal.razao_social}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Métricas Principais */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Valor Mensal */}
                    <Card className="border-corporate-green/20 bg-corporate-green/5">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-corporate-green/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-corporate-green" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-corporate-green">Valor Mensal</p>
                            <p className="text-xs text-corporate-green/80">Custo do plano</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-corporate-green">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(data.planoPrincipal.valor_mensal)}
                        </p>
                        <p className="text-xs text-corporate-green/80 mt-2">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(data.planoPrincipal.valor_mensal * 12)} por ano
                        </p>
                      </CardContent>
                    </Card>

                    {/* Cobertura Morte */}
                    <Card className="border-primary/20 bg-primary/5">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-primary/20 rounded-lg">
                            <Shield className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-primary">Cobertura Morte</p>
                            <p className="text-xs text-primary/80">Valor protegido</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(data.planoPrincipal.cobertura_morte || 0)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-primary/20 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full w-full"></div>
                          </div>
                          <span className="text-xs text-primary/80 font-medium">100%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Real-time Insight */}
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary">Análise em Tempo Real</span>
                    </div>
                    <p className="text-sm text-primary/80 mt-1">{planoInsights}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cnpjs" className="space-y-6">
            {/* Enhanced CNPJ List */}
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Building2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-semibold text-foreground">
                        Empresas Vinculadas
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        Detalhamento completo por CNPJ
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    {data.custosPorCnpj?.length || 0} empresas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.custosPorCnpj && data.custosPorCnpj.length > 0 ? (
                  <div className="divide-y divide-border">
                    {data.custosPorCnpj.map((cnpj, index) => {
                      const funcionariosPorcentagem = data.totalFuncionarios > 0 ?
                        ((cnpj.funcionarios_count / data.totalFuncionarios) * 100).toFixed(1) : '0';
                      const custoRelativo = data.custoMensalTotal > 0 ?
                        ((cnpj.valor_mensal / data.custoMensalTotal) * 100).toFixed(1) : '0';

                      return (
                        <div key={index} className="group p-6 hover:bg-muted/50 transition-all duration-300 cursor-pointer border-l-4 border-transparent hover:border-primary">
                          <div className="flex items-start justify-between">
                            {/* Company Info */}
                            <div className="flex-1 mr-6">
                              <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                                  <Building2 className="h-6 w-6 text-primary" />
                                </div>

                                <div className="flex-1">
                                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {cnpj.razao_social}
                                  </h3>

                                  <div className="flex items-center gap-2 mt-2 mb-3">
                                    <Badge variant="outline" className="text-xs">
                                      CNPJ: {cnpj.cnpj}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* Funcionários */}
                                    <Card className="border-primary/20 bg-primary/5">
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-primary/20 rounded-lg">
                                            <Users className="h-4 w-4 text-primary" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-muted-foreground">Funcionários</p>
                                            <p className="text-xl font-bold text-primary">
                                              {cnpj.funcionarios_count}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {funcionariosPorcentagem}% do total
                                            </p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>

                                    {/* Performance Badge */}
                                    <Card className="border-corporate-green/20 bg-corporate-green/5">
                                      <CardContent className="p-3">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-corporate-green/20 rounded-lg">
                                            <Star className="h-4 w-4 text-corporate-green" />
                                          </div>
                                          <div>
                                            <p className="text-sm font-medium text-muted-foreground">Participaç��o</p>
                                            <p className="text-lg font-bold text-corporate-green">
                                              {custoRelativo}%
                                            </p>
                                            <p className="text-xs text-muted-foreground">do custo total</p>
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Cost Info */}
                            <div className="text-right">
                              <Card className="border-corporate-green/20 bg-corporate-green/5">
                                <CardContent className="p-4">
                                  <p className="text-sm font-medium text-corporate-green mb-1">Valor Mensal</p>
                                  <p className="text-2xl font-bold text-corporate-green">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(cnpj.valor_mensal)}
                                  </p>
                                  <p className="text-xs text-corporate-green/80 mt-1">
                                    {new Intl.NumberFormat('pt-BR', {
                                      style: 'currency',
                                      currency: 'BRL',
                                    }).format(cnpj.valor_mensal * 12)} / ano
                                  </p>
                                </CardContent>
                              </Card>

                              {/* Action Button */}
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="mt-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Nenhum CNPJ encontrado</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Não há empresas cadastradas com dados disponíveis no momento.
                    </p>
                  </div>
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
