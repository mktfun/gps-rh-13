
import React from 'react';
import { usePulseFinanceiro } from '@/hooks/usePulseFinanceiro';
import { useSmartActions } from '@/hooks/useSmartActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertTriangle, Target, Zap, ChevronRight, Clock, DollarSign } from 'lucide-react';
import { EnhancedTooltip, EnhancedTooltipContent, EnhancedTooltipTrigger } from '@/components/ui/enhanced-tooltip';

interface InsightData {
  type: 'success' | 'warning' | 'danger' | 'info';
  icon: React.ElementType;
  title: string;
  message: string;
  explanation: string;
  actionSuggestion: string;
  financialImpact?: string;
  timeToResolve?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'financial' | 'operational' | 'strategic';
}

const InsightsAutomaticos = () => {
  const { data: pulse } = usePulseFinanceiro();
  const { data: actions } = useSmartActions();

  if (!pulse || !actions) return null;

  const insights: InsightData[] = [];

  // Insight sobre crescimento financeiro
  if (pulse.crescimento_percentual > 10) {
    insights.push({
      type: 'success',
      icon: TrendingUp,
      title: 'Crescimento Excepcional',
      message: `Sua receita cresceu ${pulse.crescimento_percentual.toFixed(1)}% este mês! 🎉`,
      explanation: 'Este crescimento indica que sua estratégia de captação está funcionando muito bem. Funcionários ativos geram receita estável e crescente.',
      actionSuggestion: 'Mantenha o foco nas empresas que mais contribuem para este crescimento e considere expandir para empresas similares.',
      financialImpact: `+${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pulse.receita_mes * (pulse.crescimento_percentual / 100))}`,
      timeToResolve: 'Ação contínua',
      priority: 'high',
      category: 'financial'
    });
  } else if (pulse.crescimento_percentual < -5) {
    insights.push({
      type: 'warning',
      icon: AlertTriangle,
      title: 'Receita em Declínio',
      message: `Receita caiu ${Math.abs(pulse.crescimento_percentual).toFixed(1)}% - Atenção necessária`,
      explanation: 'A queda na receita pode indicar desligamentos em massa, empresas cancelando contratos ou funcionários não sendo ativados adequadamente.',
      actionSuggestion: 'Revise imediatamente os CNPJs com mais exclusões, entre em contato com as empresas para entender os motivos e acelere as ativações pendentes.',
      financialImpact: `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pulse.receita_mes * (pulse.crescimento_percentual / 100))}`,
      timeToResolve: '1-2 semanas',
      priority: 'critical',
      category: 'financial'
    });
  }

  // Insight sobre margem de risco
  if (pulse.margem_risco < 70) {
    insights.push({
      type: 'danger',
      icon: AlertTriangle,
      title: 'Margem de Risco Crítica',
      message: `Apenas ${pulse.margem_risco.toFixed(1)}% dos funcionários estão ativos`,
      explanation: 'Uma margem de risco baixa indica que muitos funcionários estão pendentes ou inativos, o que compromete a receita real e pode indicar problemas operacionais.',
      actionSuggestion: 'Priorize a ativação de funcionários pendentes e revise os processos de onboarding com as empresas para reduzir o tempo de ativação.',
      financialImpact: `Potencial de +${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pulse.receita_mes * 0.3)}`,
      timeToResolve: '2-3 semanas',
      priority: 'critical',
      category: 'operational'
    });
  }

  // Insight sobre oportunidades
  if (pulse.oportunidades > 1000) {
    const potentialCnpjs = Math.round(pulse.oportunidades / 500);
    insights.push({
      type: 'info',
      icon: Target,
      title: 'Oportunidades Significativas',
      message: `${potentialCnpjs} CNPJs sem plano representam grande potencial`,
      explanation: 'Estes CNPJs já estão em sua base mas não têm planos configurados. Cada CNPJ configurado pode gerar receita mensal recorrente.',
      actionSuggestion: 'Configure os planos destes CNPJs prioritariamente. Comece pelos CNPJs com mais funcionários para maximizar o impacto.',
      financialImpact: `+${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pulse.oportunidades)}`,
      timeToResolve: '1-2 dias por CNPJ',
      priority: 'medium',
      category: 'strategic'
    });
  }

  // Insight sobre ações pendentes
  const totalActions = actions.aprovacoes_rapidas + actions.ativacoes_pendentes + actions.funcionarios_travados;
  if (totalActions > 10) {
    insights.push({
      type: 'warning',
      icon: Zap,
      title: 'Backlog de Ações Alto',
      message: `${totalActions} ações pendentes precisam de atenção imediata`,
      explanation: 'Um alto número de ações pendentes cria gargalos operacionais e pode impactar a satisfação das empresas clientes.',
      actionSuggestion: 'Dedique 2-3 horas diárias para resolver aprovações rápidas primeiro, depois funcionários travados. Use filtros para priorizar por valor.',
      financialImpact: `Risco de -${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalActions * 150)}`,
      timeToResolve: '3-5 dias',
      priority: 'high',
      category: 'operational'
    });
  }

  // Insight sobre funcionários travados
  if (actions.funcionarios_travados > 5) {
    insights.push({
      type: 'danger',
      icon: Clock,
      title: 'Funcionários Travados',
      message: `${actions.funcionarios_travados} funcionários pendentes há mais de 5 dias`,
      explanation: 'Funcionários travados há muito tempo podem indicar problemas de comunicação com as empresas ou falta de documentação.',
      actionSuggestion: 'Entre em contato com as empresas para resolver pendências de documentação. Crie um processo de follow-up automático.',
      financialImpact: `Receita potencial travada: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actions.funcionarios_travados * 45)}`,
      timeToResolve: '1-2 dias por funcionário',
      priority: 'high',
      category: 'operational'
    });
  }

  // Insight positivo quando tudo está bem
  if (insights.length === 0) {
    insights.push({
      type: 'success',
      icon: Lightbulb,
      title: 'Operação Saudável',
      message: 'Parabéns! Sua carteira está funcionando muito bem',
      explanation: 'Todos os indicadores estão dentro dos parâmetros ideais. Sua operação está equilibrada e gerando resultados consistentes.',
      actionSuggestion: 'Mantenha o foco na qualidade do atendimento e considere estratégias de crescimento para expandir sua carteira.',
      financialImpact: 'Estável',
      timeToResolve: 'Monitoramento contínuo',
      priority: 'low',
      category: 'strategic'
    });
  }

  const getVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'danger': return 'destructive';
      case 'info': return 'outline';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Insights Automáticos
          <Badge variant="secondary" className="ml-2">
            {insights.length} {insights.length === 1 ? 'insight' : 'insights'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className="group p-4 rounded-lg border bg-card hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <insight.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <Badge variant={getVariant(insight.type)} className="text-xs">
                      {insight.priority}
                    </Badge>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(insight.priority)}`}>
                      {insight.category}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{insight.message}</p>
                  
                  <div className="space-y-2">
                    <details className="group/details">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 transition-transform group-open/details:rotate-90" />
                        Ver explicação e sugestões
                      </summary>
                      <div className="mt-2 pl-4 space-y-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{insight.explanation}</p>
                        
                        <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            💡 Sugestão de Ação:
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200">{insight.actionSuggestion}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span>Impacto: {insight.financialImpact}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>Tempo: {insight.timeToResolve}</span>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default InsightsAutomaticos;
