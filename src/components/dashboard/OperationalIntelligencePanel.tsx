import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, TrendingUp, Clock, Shield, Users, Target, Zap } from 'lucide-react';
import { useOperationalMetrics } from '@/hooks/useOperationalMetrics';
import { CardLoadingState } from '@/components/ui/loading-state';
export const OperationalIntelligencePanel = () => {
  const {
    data: metrics,
    isLoading,
    error
  } = useOperationalMetrics();
  if (isLoading) {
    return <CardLoadingState className="col-span-full" />;
  }
  if (error || !metrics) {
    return <Card className="col-span-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Erro ao carregar métricas operacionais
          </p>
        </CardContent>
      </Card>;
  }
  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getStatusBadge = (value: number, isPercentage: boolean = true) => {
    const displayValue = isPercentage ? `${value}%` : value.toString();
    if (isPercentage) {
      if (value >= 80) return <Badge className="bg-green-100 text-green-800">{displayValue}</Badge>;
      if (value >= 60) return <Badge className="bg-yellow-100 text-yellow-800">{displayValue}</Badge>;
      return <Badge className="bg-red-100 text-red-800">{displayValue}</Badge>;
    }
    return <Badge variant="outline">{displayValue}</Badge>;
  };
  const totalAlertas = metrics.alertas.funcionarios_travados + metrics.alertas.cnpjs_sem_plano + metrics.alertas.empresas_inativas;
  return <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produtividade da Carteira</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {getStatusBadge(metrics.produtividade_carteira)}
              </div>
              <Progress value={metrics.produtividade_carteira} className="w-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Empresas com planos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualidade da Gestão</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {getStatusBadge(metrics.qualidade_gestao)}
              </div>
              <Progress value={metrics.qualidade_gestao} className="w-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Funcionários sem pendências
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cobertura de Seguros</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {getStatusBadge(metrics.cobertura_seguros)}
              </div>
              <Progress value={metrics.cobertura_seguros} className="w-20" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              CNPJs com planos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crescimento Mensal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge variant={metrics.crescimento_carteira >= 0 ? "default" : "destructive"}>
                {metrics.crescimento_carteira >= 0 ? '+' : ''}
                {metrics.crescimento_carteira}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo de funcionários no mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de Eficiência e Alertas */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Eficiência Operacional */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Eficiência Operacional
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Tempo de Ativação</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {metrics.eficiencia_ativacao.toFixed(1)} dias
                </div>
                <div className="text-xs text-muted-foreground">
                  Média para ativar pendentes
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Velocidade de Resposta</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">
                  {metrics.velocidade_resposta}
                </div>
                <div className="text-xs text-muted-foreground">
                  Resolvidos em 7 dias
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas Inteligentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Alertas Inteligentes
              </div>
              <Badge variant={totalAlertas > 0 ? "destructive" : "default"}>
                {totalAlertas} alertas
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm">Funcionários Travados</span>
              <Badge variant={metrics.alertas.funcionarios_travados > 0 ? "destructive" : "secondary"}>
                {metrics.alertas.funcionarios_travados}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm">CNPJs sem Plano</span>
              <Badge variant={metrics.alertas.cnpjs_sem_plano > 0 ? "destructive" : "secondary"}>
                {metrics.alertas.cnpjs_sem_plano}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 rounded border">
              <span className="text-sm">Empresas Inativas</span>
              <Badge variant={metrics.alertas.empresas_inativas > 0 ? "destructive" : "secondary"}>
                {metrics.alertas.empresas_inativas}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Performance */}
      
    </div>;
};