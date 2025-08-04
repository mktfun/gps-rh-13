
import React from 'react';
import { useSmartActions } from '@/hooks/useSmartActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, UserPlus, FileText, Clock, ArrowRight, DollarSign, Timer, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { EnhancedTooltip, EnhancedTooltipContent, EnhancedTooltipTrigger, EnhancedTooltipProvider } from '@/components/ui/enhanced-tooltip';

interface SmartActionItem {
  id: string;
  title: string;
  count: number;
  icon: React.ElementType;
  color: string;
  action: () => void;
  description: string;
  detailedExplanation: string;
  financialImpact: string;
  timeToComplete: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'revenue' | 'operational' | 'strategic';
}

const SmartActionsSection = () => {
  const { data: actions, isLoading } = useSmartActions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!actions) return null;

  const smartActions: SmartActionItem[] = [
    {
      id: 'aprovacoes_rapidas',
      title: 'Aprovações Rápidas',
      count: actions.aprovacoes_rapidas,
      icon: CheckCircle,
      color: 'bg-green-500',
      action: () => navigate('/corretora/relatorios/funcionarios?status=exclusao_solicitada'),
      description: 'Exclusões aguardando sua aprovação',
      detailedExplanation: 'Funcionários que as empresas solicitaram exclusão e estão aguardando sua aprovação final. Aprovar rapidamente mantém boa relação com as empresas.',
      financialImpact: `Economia: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actions.aprovacoes_rapidas * 45)}/mês`,
      timeToComplete: '30 segundos por funcionário',
      priority: 'high',
      difficulty: 'easy',
      category: 'operational'
    },
    {
      id: 'ativacoes_pendentes',
      title: 'Ativações Pendentes',
      count: actions.ativacoes_pendentes,
      icon: UserPlus,
      color: 'bg-blue-500',
      action: () => navigate('/corretora/relatorios/funcionarios?status=pendente'),
      description: 'Funcionários aguardando ativação',
      detailedExplanation: 'Novos funcionários cadastrados pelas empresas que ainda não foram ativados. Cada ativação gera receita imediata e melhora a satisfação do cliente.',
      financialImpact: `Receita potencial: +${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actions.ativacoes_pendentes * 45)}/mês`,
      timeToComplete: '1-2 minutos por funcionário',
      priority: 'medium',
      difficulty: 'easy',
      category: 'revenue'
    },
    {
      id: 'cnpjs_sem_plano',
      title: 'CNPJs sem Plano',
      count: actions.cnpjs_sem_plano,
      icon: FileText,
      color: 'bg-purple-500',
      action: () => navigate('/corretora/dados-planos'),
      description: 'CNPJs precisam de configuração',
      detailedExplanation: 'CNPJs ativos que não têm planos de seguro configurados. Configurar estes planos permite que os funcionários sejam ativados e geram receita.',
      financialImpact: `Receita potencial: +${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actions.cnpjs_sem_plano * 500)}/mês`,
      timeToComplete: '5-10 minutos por CNPJ',
      priority: 'high',
      difficulty: 'medium',
      category: 'strategic'
    },
    {
      id: 'funcionarios_travados',
      title: 'Funcionários Travados',
      count: actions.funcionarios_travados,
      icon: Clock,
      color: 'bg-orange-500',
      action: () => navigate('/corretora/relatorios/funcionarios?status=pendente'),
      description: 'Pendentes há mais de 5 dias',
      detailedExplanation: 'Funcionários que estão pendentes há muito tempo podem indicar problemas de documentação ou comunicação. Resolver rapidamente evita escalações.',
      financialImpact: `Receita travada: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(actions.funcionarios_travados * 45)}/mês`,
      timeToComplete: '3-5 minutos por funcionário',
      priority: 'high',
      difficulty: 'medium',
      category: 'operational'
    }
  ];

  const totalActions = smartActions.reduce((sum, action) => sum + action.count, 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <EnhancedTooltipProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Ações Inteligentes
            {totalActions > 0 && (
              <Badge variant="destructive" className="ml-2">
                {totalActions}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalActions === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600 mb-2">Excelente trabalho!</p>
              <p className="text-sm text-muted-foreground">
                Todas as ações estão em dia. Sua operação está funcionando perfeitamente.
              </p>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-700">
                  💡 <strong>Dica:</strong> Mantenha este ritmo verificando o dashboard diariamente 
                  e agindo rapidamente quando novas ações aparecerem.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {smartActions.map((action) => (
                <EnhancedTooltip key={action.id}>
                  <EnhancedTooltipTrigger asChild>
                    <div
                      className={`relative overflow-hidden rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                        action.count > 0 ? 'border-orange-200 bg-orange-50 hover:bg-orange-100' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <action.icon className="h-5 w-5 text-gray-600" />
                            <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                          </div>
                          <Badge variant={action.count > 0 ? 'destructive' : 'secondary'} className="text-lg font-bold">
                            {action.count}
                          </Badge>
                        </div>
                        
                        <h3 className="font-medium text-sm mb-1">{action.title}</h3>
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {action.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-xs mb-3">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            <span className="font-medium">
                              {action.count > 0 ? action.financialImpact.split(':')[1] : 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{getDifficultyIcon(action.difficulty)}</span>
                            <Timer className="h-3 w-3" />
                            <span>{action.timeToComplete}</span>
                          </div>
                        </div>
                        
                        {action.count > 0 && (
                          <Button
                            onClick={action.action}
                            size="sm"
                            className="w-full"
                            variant="outline"
                          >
                            Resolver Agora
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </EnhancedTooltipTrigger>
                  <EnhancedTooltipContent variant="info" className="max-w-80">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <action.icon className="h-4 w-4" />
                        <h4 className="font-semibold">{action.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {action.category}
                        </Badge>
                      </div>
                      
                      <p className="text-sm">{action.detailedExplanation}</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">Impacto Financeiro:</span>
                          <span className="text-green-600">{action.financialImpact}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">Tempo p/ Resolver:</span>
                          <span>{action.timeToComplete}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium">Dificuldade:</span>
                          <span className="flex items-center gap-1">
                            {getDifficultyIcon(action.difficulty)}
                            {action.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      {action.count > 0 && (
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-xs font-medium text-blue-900 mb-1">
                            ⚡ Ação Recomendada:
                          </p>
                          <p className="text-xs text-blue-800">
                            {action.priority === 'high' || action.priority === 'critical' 
                              ? 'Priorize esta ação hoje para maximizar resultados.' 
                              : 'Inclua esta ação no seu planejamento semanal.'}
                          </p>
                        </div>
                      )}
                    </div>
                  </EnhancedTooltipContent>
                </EnhancedTooltip>
              ))}
            </div>
          )}
          
          {totalActions > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Resumo das Ações</h4>
              </div>
              <p className="text-sm text-blue-800 mb-2">
                Você tem <strong>{totalActions} ações pendentes</strong> que podem gerar{' '}
                <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  (actions.ativacoes_pendentes + actions.funcionarios_travados) * 45 + actions.cnpjs_sem_plano * 500
                )}</strong> de receita adicional mensal.
              </p>
              <p className="text-xs text-blue-700">
                💡 <strong>Dica:</strong> Dedique 30-45 minutos diários para resolver essas ações. 
                Comece pelas de maior impacto financeiro e menor tempo de resolução.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </EnhancedTooltipProvider>
  );
};

export default SmartActionsSection;
