
import React from 'react';
import { EnhancedTooltip, EnhancedTooltipContent, EnhancedTooltipTrigger } from './enhanced-tooltip';
import { Info, TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';

interface MetricExplanationProps {
  title: string;
  value: string | number;
  description: string;
  explanation: string;
  actionSuggestion?: string;
  trend?: 'up' | 'down' | 'stable';
  variant?: 'default' | 'info' | 'warning' | 'success';
  impact?: 'low' | 'medium' | 'high';
}

export const MetricExplanation: React.FC<MetricExplanationProps> = ({
  title,
  value,
  description,
  explanation,
  actionSuggestion,
  trend,
  variant = 'default',
  impact = 'medium'
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-blue-500" />;
    }
  };

  const getImpactColor = () => {
    switch (impact) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{title}</span>
        <EnhancedTooltip>
          <EnhancedTooltipTrigger asChild>
            <Info className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
          </EnhancedTooltipTrigger>
          <EnhancedTooltipContent variant={variant} className="max-w-80">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <h4 className="font-semibold text-sm">{title}</h4>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">{explanation}</p>
                
                {actionSuggestion && (
                  <div className="bg-blue-50 dark:bg-blue-950 p-2 rounded">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                      💡 Sugestão de Ação:
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-200">{actionSuggestion}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Impacto no Negócio:</span>
                  <span className={`font-medium ${getImpactColor()}`}>
                    {impact.charAt(0).toUpperCase() + impact.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </EnhancedTooltipContent>
        </EnhancedTooltip>
      </div>
      
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm text-muted-foreground">{description}</span>
      </div>
    </div>
  );
};
