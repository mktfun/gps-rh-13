
import React from 'react';
import { usePulseFinanceiro } from '@/hooks/usePulseFinanceiro';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { MetricExplanation } from '@/components/ui/metric-explanation';
import { EnhancedTooltipProvider } from '@/components/ui/enhanced-tooltip';
import { formatCurrency } from '@/lib/utils';

const PulseFinanceiro = () => {
  const { data: pulse, isLoading } = usePulseFinanceiro();

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!pulse) return null;

  const formatPercentage = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

  const getMargemStatus = (margem: number) => {
    if (margem >= 80) return { label: 'Excelente', variant: 'default' as const, color: 'text-green-600' };
    if (margem >= 60) return { label: 'Boa', variant: 'secondary' as const, color: 'text-yellow-600' };
    if (margem >= 40) return { label: 'Atenção', variant: 'secondary' as const, color: 'text-orange-600' };
    return { label: 'Crítica', variant: 'destructive' as const, color: 'text-red-600' };
  };

  const margemStatus = getMargemStatus(pulse.margem_risco);

  return (
    <EnhancedTooltipProvider>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Receita do Mês - Apenas Seguros de Vida */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <MetricExplanation
                title="Receita do Mês"
                value={formatCurrency(pulse.receita_mes)}
                description="seguros de vida ativos"
                explanation="Receita mensal total dos seguros de vida ativos neste mês. Inclui apenas planos do tipo 'vida' em CNPJs com status 'ativo' e funcionários com status 'ativo'."
                actionSuggestion="Para aumentar: ative funcionários pendentes, configure novos planos de vida em CNPJs sem cobertura e mantenha baixa taxa de desligamentos."
                trend={pulse.crescimento_percentual >= 0 ? 'up' : 'down'}
                variant={pulse.crescimento_percentual >= 0 ? 'success' : 'warning'}
                impact={pulse.receita_mes > 10000 ? 'high' : pulse.receita_mes > 5000 ? 'medium' : 'low'}
              />
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-1 text-xs mt-2">
              {pulse.crescimento_percentual >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={pulse.crescimento_percentual >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(pulse.crescimento_percentual)}
              </span>
              <span className="text-muted-foreground">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        {/* Comissão Estimada - Nova Lógica: 20% Vida + 5% Outros */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <MetricExplanation
                title="Comissão Estimada"
                value={formatCurrency(pulse.comissao_estimada)}
                description="vida 20% + outros 5%"
                explanation="Comissão total calculada com taxas diferenciadas: 20% sobre seguros de vida e 5% sobre outros tipos de seguro. Esta é uma estimativa baseada nas taxas padrão do mercado."
                actionSuggestion="Para maximizar: foque na venda de seguros de vida (comissão de 20%) e aumente o volume de funcionários em empresas com maior valor mensal."
                trend="stable"
                variant="success"
                impact={pulse.comissao_estimada > 2000 ? 'high' : pulse.comissao_estimada > 1000 ? 'medium' : 'low'}
              />
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">
              Taxas: Vida 20%, Outros 5%
            </p>
          </CardContent>
        </Card>

        {/* Margem de Risco */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <MetricExplanation
                title="Margem de Risco"
                value={`${pulse.margem_risco.toFixed(1)}%`}
                description="funcionários ativos"
                explanation="Indica a porcentagem de funcionários que estão efetivamente ativos vs. total cadastrado. Uma margem baixa pode indicar problemas no processo de ativação ou alta rotatividade."
                actionSuggestion="Margem ideal: >80%. Se estiver baixa, revise processos de ativação, melhore comunicação com empresas e acelere aprovações pendentes."
                trend={pulse.margem_risco >= 70 ? 'up' : 'down'}
                variant={pulse.margem_risco >= 70 ? 'success' : 'warning'}
                impact={pulse.margem_risco < 50 ? 'high' : pulse.margem_risco < 70 ? 'medium' : 'low'}
              />
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant={margemStatus.variant} className="mt-2">
              {margemStatus.label}
            </Badge>
          </CardContent>
        </Card>

        {/* Oportunidades - Específico para Seguros de Vida */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              <MetricExplanation
                title="Oportunidades"
                value={formatCurrency(pulse.oportunidades)}
                description="potencial seguros de vida"
                explanation="Valor estimado de receita adicional baseado em CNPJs ativos que ainda não têm seguros de vida configurados. Cada CNPJ representa aproximadamente R$ 500 de receita potencial mensal."
                actionSuggestion="Priorize configurar seguros de vida nos CNPJs com maior número de funcionários para maximizar o retorno. Foque em empresas com perfil adequado para seguros de vida."
                trend="up"
                variant="info"
                impact={pulse.oportunidades > 2000 ? 'high' : pulse.oportunidades > 1000 ? 'medium' : 'low'}
              />
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(pulse.oportunidades / 500)} CNPJs sem seguro de vida
            </p>
          </CardContent>
        </Card>
      </div>
    </EnhancedTooltipProvider>
  );
};

export default PulseFinanceiro;
