
import React from 'react';
import { Building2, Users, FileText, AlertTriangle } from 'lucide-react';
import ClickableStatCard from './ClickableStatCard';

interface MetricsOverviewProps {
  totalEmpresas: number;
  totalCnpjs: number;
  totalFuncionarios: number;
  totalPendencias: number;
}

const MetricsOverview = ({
  totalEmpresas,
  totalCnpjs,
  totalFuncionarios,
  totalPendencias
}: MetricsOverviewProps) => {
  const metrics = [
    {
      title: "Total de Empresas",
      value: totalEmpresas,
      description: "Clique para gerenciar empresas",
      icon: Building2,
      to: "/corretora/empresas",
      delay: "0ms"
    },
    {
      title: "Total de CNPJs",
      value: totalCnpjs,
      description: "Clique para ver dados dos planos",
      icon: FileText,
      to: "/corretora/dados-planos",
      delay: "100ms"
    },
    {
      title: "Total de Funcionários",
      value: totalFuncionarios,
      description: "Clique para ver relatório",
      icon: Users,
      to: "/corretora/relatorios/funcionarios",
      delay: "200ms"
    },
    {
      title: "Todas as Pendências",
      value: totalPendencias,
      description: "Clique para ver pendências",
      icon: AlertTriangle,
      to: "/corretora/relatorios/funcionarios?status=exclusao_solicitada",
      className: "border-orange-200 hover:border-orange-300",
      delay: "300ms"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">📊 Indicadores Gerais</h2>
          <p className="text-sm text-gray-600 mt-1">Visão geral dos principais métricas</p>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, index) => (
          <div
            key={metric.title}
            className="animate-fade-in opacity-0"
            style={{ 
              animationDelay: metric.delay,
              animationFillMode: 'forwards'
            }}
          >
            <ClickableStatCard
              title={metric.title}
              value={metric.value}
              description={metric.description}
              icon={metric.icon}
              to={metric.to}
              className={metric.className}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsOverview;
