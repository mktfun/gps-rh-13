import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Building2, 
  DollarSign, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Target,
  ArrowUpRight,
  Calendar,
  FileText,
  Settings
} from 'lucide-react';
import { CorrigirPendenciasButton } from '@/components/debug/CorrigirPendenciasButton';
import { FinancialDataDebug } from '@/components/debug/FinancialDataDebug';
import { useOperationalMetrics } from '@/hooks/useOperationalMetrics';
import { cn } from '@/lib/utils';

const CorretoraDashboard = () => {
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);
  const { data: metrics, isLoading } = useOperationalMetrics();

  if (!user) {
    return <DashboardLoadingState />;
  }

  // KPI Cards Data
  const kpiCards = [
    {
      title: "Empresas Ativas",
      value: metrics?.kpis?.empresas_ativas || "0",
      change: "+12%",
      trend: "up" as const,
      icon: Building2,
      description: "vs. mês anterior",
      color: "blue"
    },
    {
      title: "Funcionários Ativos",
      value: metrics?.kpis?.funcionarios_ativos || "0",
      change: "+8%",
      trend: "up" as const,
      icon: Users,
      description: "vs. mês anterior",
      color: "green"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${(metrics?.kpis?.receita_mensal || 0).toLocaleString('pt-BR')}`,
      change: "+15%",
      trend: "up" as const,
      icon: DollarSign,
      description: "vs. mês anterior",
      color: "emerald"
    },
    {
      title: "Pendências",
      value: metrics?.alertas ? 
        (metrics.alertas.funcionarios_travados + metrics.alertas.cnpjs_sem_plano + metrics.alertas.empresas_inativas).toString() : 
        "0",
      change: "-5%",
      trend: "down" as const,
      icon: AlertTriangle,
      description: "vs. semana anterior",
      color: "amber"
    }
  ];

  // Smart Actions Data
  const smartActions = [
    {
      title: "Ativar Funcionários",
      count: metrics?.alertas?.funcionarios_travados || 0,
      impact: "Alta prioridade",
      description: "Funcionários com status travado precisam ser ativados",
      icon: Users,
      color: "red",
      action: () => {}
    },
    {
      title: "Configurar Planos",
      count: metrics?.alertas?.cnpjs_sem_plano || 0,
      impact: "Perda de receita",
      description: "CNPJs sem plano configurado",
      icon: FileText,
      color: "amber",
      action: () => {}
    },
    {
      title: "Reativar Empresas",
      count: metrics?.alertas?.empresas_inativas || 0,
      impact: "Retenção",
      description: "Empresas inativas que podem ser reativadas",
      icon: Building2,
      color: "blue",
      action: () => {}
    }
  ];

  const getCardColorClasses = (color: string) => {
    const colors = {
      blue: "border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20",
      green: "border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20",
      emerald: "border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/30 dark:to-emerald-900/20",
      amber: "border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20",
      red: "border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-900/20"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColorClasses = (color: string) => {
    const colors = {
      blue: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      green: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
      emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30",
      amber: "text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30",
      red: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard Inteligente
          </h1>
          <p className="text-muted-foreground">
            Bem-vindo, <span className="font-medium text-primary">{user?.email}</span>!
            Gerencie suas operações com insights em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CorrigirPendenciasButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            {showDebug ? 'Ocultar Debug' : 'Debug Financeiro'}
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className={cn("border transition-all duration-200 hover:shadow-lg", getCardColorClasses(kpi.color))}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                  <div className="flex items-center gap-1 text-sm">
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-600" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-green-600" />
                    )}
                    <span className="text-green-600 font-medium">{kpi.change}</span>
                    <span className="text-muted-foreground">{kpi.description}</span>
                  </div>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", getIconColorClasses(kpi.color))}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inteligência Operacional Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-primary rounded-full"></div>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Inteligência Operacional
            </h2>
            <p className="text-sm text-muted-foreground">Métricas de performance da carteira</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Produtividade Card */}
          <Card className="border transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-600" />
                Produtividade da Carteira
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metrics?.eficiencia?.produtividade_carteira || 0}%
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Excelente
                </Badge>
              </div>
              <Progress value={metrics?.eficiencia?.produtividade_carteira || 0} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Baseado na relação funcionários ativos/empresas
              </p>
            </CardContent>
          </Card>

          {/* Eficiência Card */}
          <Card className="border transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-600" />
                Taxa de Eficiência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metrics?.eficiencia?.taxa_eficiencia || 0}%
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Ótimo
                </Badge>
              </div>
              <Progress value={metrics?.eficiencia?.taxa_eficiencia || 0} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Performance geral das operações
              </p>
            </CardContent>
          </Card>

          {/* Qualidade Card */}
          <Card className="border transition-all duration-200 hover:shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                Qualidade dos Dados
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {metrics?.eficiencia?.qualidade_dados || 0}%
                </span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Alto
                </Badge>
              </div>
              <Progress value={metrics?.eficiencia?.qualidade_dados || 0} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Integridade e completude dos dados
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Inteligentes Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-green-500 rounded-full"></div>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Ações Inteligentes
            </h2>
            <p className="text-sm text-muted-foreground">Ações prioritárias para otimizar resultados</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {smartActions.map((action, index) => (
            <Card key={index} className={cn("border transition-all duration-200 hover:shadow-lg cursor-pointer group", getCardColorClasses(action.color))}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", getIconColorClasses(action.color))}>
                      <action.icon className="h-6 w-6" />
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      {action.count} itens
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {action.impact}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Debug Section */}
      {showDebug && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-red-500 rounded-full"></div>
            <div>
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Settings className="h-5 w-5 text-red-500" />
                Diagnóstico Financeiro
              </h2>
              <p className="text-sm text-muted-foreground">Informações de debug do sistema</p>
            </div>
          </div>
          <FinancialDataDebug />
        </div>
      )}
    </div>
  );
};

export default CorretoraDashboard;
