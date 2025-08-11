
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, CheckCircle, Calendar } from 'lucide-react';

interface PendenciasKPICardsProps {
  totalPendencias: number;
  pendenciasCriticas: number;
  pendenciasUrgentes: number;
  pendenciasNormais: number;
  isLoading?: boolean;
}

export const PendenciasKPICards: React.FC<PendenciasKPICardsProps> = ({
  totalPendencias,
  pendenciasCriticas,
  pendenciasUrgentes,
  pendenciasNormais,
  isLoading = false
}) => {
  const kpis = [
    {
      title: "Total de Pendências",
      value: totalPendencias,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Críticas",
      value: pendenciasCriticas,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Prazo vencido"
    },
    {
      title: "Urgentes",
      value: pendenciasUrgentes,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Até 7 dias"
    },
    {
      title: "Normais",
      value: pendenciasNormais,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Sem urgência"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card key={kpi.title} className={`border-l-4 ${kpi.borderColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${kpi.color}`}>
                {kpi.value.toLocaleString()}
              </div>
              {kpi.description && (
                <p className="text-xs text-gray-500 mt-1">
                  {kpi.description}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
