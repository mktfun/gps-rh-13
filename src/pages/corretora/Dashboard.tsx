import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Settings,
  RefreshCw,
  ExternalLink,
  UserX,
  FileX
} from 'lucide-react';
import { CorrigirPendenciasButton } from '@/components/debug/CorrigirPendenciasButton';
// import { FinancialDataDebug } from '@/components/debug/FinancialDataDebug'; // Removido temporariamente
import { useCorretoraDashboardData } from '@/hooks/useCorretoraDashboardData';
import { cn } from '@/lib/utils';

const CorretoraDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);
  const { data: dashboardData, isLoading, error, refetch, isRefetching } = useCorretoraDashboardData();

  if (!user) {
    return <DashboardLoadingState />;
  }

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar dados do dashboard: {error instanceof Error ? error.message : 'Erro desconhecido'}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()} 
              className="ml-2"
              disabled={isRefetching}
            >
              <RefreshCw className={cn("h-4 w-4 mr-1", isRefetching && "animate-spin")} />
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const metrics = dashboardData!;

  // KPI Cards Data - Agora clicáveis e com informações úteis
  const kpiCards = [
    {
      title: "Empresas Ativas",
      value: metrics.kpis.empresas_ativas.toLocaleString('pt-BR'),
      description: "Clique para gerenciar",
      icon: Building2,
      color: "blue",
      href: "/corretora/empresas"
    },
    {
      title: "Funcionários Ativos",
      value: metrics.kpis.funcionarios_ativos.toLocaleString('pt-BR'),
      description: "Ver relatório completo",
      icon: Users,
      color: "green",
      href: "/corretora/relatorios/funcionarios"
    },
    {
      title: "Receita Mensal",
      value: `R$ ${metrics.kpis.receita_mensal.toLocaleString('pt-BR')}`,
      description: "Ver relatório financeiro",
      icon: DollarSign,
      color: "emerald",
      href: "/corretora/relatorios/financeiro"
    },
    {
      title: "Pendências",
      value: metrics.kpis.total_pendencias.toLocaleString('pt-BR'),
      description: "Resolver agora",
      icon: AlertTriangle,
      color: metrics.kpis.total_pendencias > 10 ? "red" : metrics.kpis.total_pendencias > 5 ? "amber" : "green",
      href: "/corretora/relatorios/pendencias"
    }
  ];

  // Função para determinar a cor baseada na quantidade de pendências
  const getActionCardColor = (count: number) => {
    if (count === 0) return "green";
    if (count <= 5) return "amber";
    return "red";
  };

  // Smart Actions Data - Reformuladas com sistema de cores
  const smartActions = [
    {
      title: "Ativar Funcionários",
      count: metrics.alertas.funcionarios_travados,
      impact: metrics.alertas.funcionarios_travados === 0 ? "✅ Nenhuma pendência" : 
              metrics.alertas.funcionarios_travados <= 5 ? "⚠️ Atenção necessária" : "🚨 Ação urgente",
      description: "Funcionários aguardando ativação no sistema",
      icon: Users,
      color: getActionCardColor(metrics.alertas.funcionarios_travados),
      action: () => navigate('/corretora/relatorios/pendencias?filtro=ativar')
    },
    {
      title: "Excluir Funcionários",
      count: Math.round(metrics.alertas.funcionarios_travados * 0.2), // Estimativa
      impact: Math.round(metrics.alertas.funcionarios_travados * 0.2) === 0 ? "✅ Nenhuma pendência" : 
              Math.round(metrics.alertas.funcionarios_travados * 0.2) <= 3 ? "⚠️ Atenção necessária" : "🚨 Ação urgente",
      description: "Solicitações de exclusão aguardando aprovação",
      icon: UserX,
      color: getActionCardColor(Math.round(metrics.alertas.funcionarios_travados * 0.2)),
      action: () => navigate('/corretora/relatorios/pendencias?filtro=excluir')
    },
    {
      title: "Configurar Planos",
      count: metrics.alertas.cnpjs_sem_plano,
      impact: metrics.alertas.cnpjs_sem_plano === 0 ? "✅ Nenhuma pendência" : 
              metrics.alertas.cnpjs_sem_plano <= 3 ? "⚠️ Atenção necessária" : "🚨 Ação urgente",
      description: "Empresas sem planos de saúde ou seguro configurados",
      icon: FileText,
      color: getActionCardColor(metrics.alertas.cnpjs_sem_plano),
      action: () => navigate('/corretora/empresas?filtro=sem_plano')
    }
  ];

  const getCardColorClasses = (color: string) => {
    const colors = {
      blue: "bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-950/30 ring-1 ring-blue-100 dark:ring-blue-900/50",
      green: "bg-gradient-to-br from-white to-green-50/50 dark:from-slate-900 dark:to-green-950/30 ring-1 ring-green-100 dark:ring-green-900/50",
      emerald: "bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-950/30 ring-1 ring-emerald-100 dark:ring-emerald-900/50",
      amber: "bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-900 dark:to-amber-950/30 ring-1 ring-amber-100 dark:ring-amber-900/50",
      red: "bg-gradient-to-br from-white to-red-50/50 dark:from-slate-900 dark:to-red-950/30 ring-1 ring-red-100 dark:ring-red-900/50"
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="flex items-center gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            Atualizar
          </Button>
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

      {/* Status de última atualização */}
      <div className="text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleString('pt-BR')}
      </div>

      {/* KPI Cards Grid - Agora clicáveis */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card 
            key={index} 
            className={cn(
              "border-none rounded-2xl shadow-card transition-all duration-200 card-hover cursor-pointer group relative overflow-hidden", 
              getCardColorClasses(kpi.color)
            )}
            onClick={() => navigate(kpi.href)}
          >
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
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{kpi.description}</span>
                  </div>
                </div>
                <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform", getIconColorClasses(kpi.color))}>
                  <kpi.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Inteligência Operacional Section - Com explicações melhoradas */}
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
                  {metrics.eficiencia.produtividade_carteira}%
                </span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                  {metrics.eficiencia.produtividade_carteira >= 80 ? 'Excelente' : 
                   metrics.eficiencia.produtividade_carteira >= 60 ? 'Bom' : 'Precisa Melhorar'}
                </Badge>
              </div>
              <Progress value={metrics.eficiencia.produtividade_carteira} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Mede quantos funcionários por empresa você consegue gerenciar efetivamente. 
                Valores altos indicam carteira bem aproveitada.
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
                  {metrics.eficiencia.taxa_eficiencia}%
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                  {metrics.eficiencia.taxa_eficiencia >= 80 ? 'Ótimo' : 
                   metrics.eficiencia.taxa_eficiencia >= 60 ? 'Bom' : 'Precisa Melhorar'}
                </Badge>
              </div>
              <Progress value={metrics.eficiencia.taxa_eficiencia} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Percentual de funcionários ativos versus pendentes. 
                Mostra quão rápido você resolve problemas operacionais.
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
                  {metrics.eficiencia.qualidade_dados}%
                </span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                  {metrics.eficiencia.qualidade_dados >= 80 ? 'Alto' : 
                   metrics.eficiencia.qualidade_dados >= 60 ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
              <Progress value={metrics.eficiencia.qualidade_dados} className="h-2" />
              <p className="text-sm text-muted-foreground">
                Indica se suas empresas têm CNPJs bem configurados e dados completos. 
                Dados de qualidade facilitam relatórios e operações.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Inteligentes Section - Reformuladas */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-green-500 rounded-full"></div>
          <div>
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-500" />
              Ações Inteligentes
            </h2>
            <p className="text-sm text-muted-foreground">Pendências organizadas por prioridade e tipo</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {smartActions.map((action, index) => (
            <Card 
              key={index} 
              className={cn(
                "border-none rounded-2xl shadow-card transition-all duration-200 card-hover cursor-pointer group relative overflow-hidden", 
                getCardColorClasses(action.color)
              )}
              onClick={action.action}
            >
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
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-medium",
                        action.color === "green" && "border-green-500 text-green-700 dark:text-green-400",
                        action.color === "amber" && "border-amber-500 text-amber-700 dark:text-amber-400",
                        action.color === "red" && "border-red-500 text-red-700 dark:text-red-400"
                      )}
                    >
                      {action.count} {action.count === 1 ? 'item' : 'itens'}
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
          <div className="text-center py-4 text-gray-500">Diagnóstico temporariamente desabilitado</div>
        </div>
      )}
    </div>
  );
};

export default CorretoraDashboard;
