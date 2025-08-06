
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCorretoraDashboardMetrics } from '@/hooks/useCorretoraDashboardMetrics';
import { Building2, Users, FileText, AlertTriangle, BarChart3, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import StatCard from '@/components/dashboard/StatCard';
import RevenueCard from '@/components/dashboard/RevenueCard';
import ChartCard from '@/components/dashboard/ChartCard';
import RankingCard from '@/components/dashboard/RankingCard';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const EnhancedCorretoraDashboard = () => {
  const { user } = useAuth();
  const { data: dashboardData, isLoading } = useCorretoraDashboardMetrics();

  const breadcrumbItems = [
    { label: 'Corretora', href: '/corretora/dashboard' },
    { label: 'Dashboard Avançado', icon: BarChart3 }
  ];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} className="mb-4" />
            <h1 className="text-3xl font-bold mb-2">Dashboard Avançado da Corretora</h1>
            <p className="text-muted-foreground">
              Carregando métricas financeiras e operacionais...
            </p>
          </div>
          <DashboardLoadingState />
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Breadcrumbs items={breadcrumbItems} className="mb-4" />
            <h1 className="text-3xl font-bold mb-2">Dashboard Avançado da Corretora</h1>
            <p className="text-muted-foreground">
              Erro ao carregar dados do dashboard
            </p>
          </div>
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              Não foi possível carregar os dados. Tente recarregar a página.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Breadcrumbs items={breadcrumbItems} className="mb-4" />
          <h1 className="text-3xl font-bold mb-2">Dashboard Avançado da Corretora</h1>
          <p className="text-muted-foreground">
            Bem-vindo, {user?.email}! Aqui estão as métricas detalhadas do seu negócio.
          </p>
        </div>

        {/* Cards de KPIs Principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
          <StatCard
            title="Total de Empresas"
            value={dashboardData.totalEmpresas}
            description="Empresas cadastradas"
            icon={Building2}
          />
          <StatCard
            title="Total de CNPJs"
            value={dashboardData.totalCnpjs}
            description="CNPJs ativos"
            icon={FileText}
          />
          <StatCard
            title="Total de Funcionários"
            value={dashboardData.totalFuncionarios}
            description="Funcionários segurados"
            icon={Users}
          />
          <StatCard
            title="Pendências"
            value={dashboardData.funcionariosPendentes}
            description="Funcionários para aprovar"
            icon={AlertTriangle}
          />
          <RevenueCard
            title="Receita Mensal"
            value={dashboardData.receitaMensalEstimada}
            description="Receita estimada total"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Gráfico de Evolução com Receita */}
          <ChartCard
            title="Evolução Mensal Completa"
            description="Crescimento de funcionários, empresas e receita"
          >
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.estatisticasMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'receita') {
                      return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)), 'Receita'];
                    }
                    return [value, name === 'empresas' ? 'Empresas' : 'Funcionários'];
                  }}
                />
                <Bar dataKey="empresas" fill="#8884d8" name="Empresas" />
                <Bar dataKey="funcionarios" fill="#82ca9d" name="Funcionários" />
                <Bar dataKey="receita" fill="#ffc658" name="Receita" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gráfico de Receita por Seguradora */}
          <ChartCard
            title="Receita por Seguradora"
            description="Distribuição de receita entre seguradoras"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.receitaPorSeguradora}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ seguradora, percent }) => `${seguradora} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor_total"
                >
                  {dashboardData.receitaPorSeguradora.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [
                    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value)),
                    'Receita Mensal'
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Ranking de Empresas */}
          <RankingCard
            title="Ranking de Empresas por Receita"
            items={dashboardData.rankingEmpresas}
          />

          {/* Gráfico de Status */}
          <ChartCard
            title="Distribuição por Status"
            description="Status dos funcionários"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.distribuicaoPorStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboardData.distribuicaoPorStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Empresas Recentes com Receita */}
        <Card>
          <CardHeader>
            <CardTitle>Empresas Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.empresasRecentes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma empresa cadastrada ainda
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.empresasRecentes.map((empresa) => (
                  <div key={empresa.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h3 className="font-medium">{empresa.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        Cadastrada em {new Date(empresa.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {empresa.funcionarios_count} funcionários
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(empresa.receita_mensal)}/mês
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedCorretoraDashboard;
