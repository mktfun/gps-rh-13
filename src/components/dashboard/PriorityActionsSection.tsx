
import React from 'react';
import { AlertTriangle, UserPlus, Settings } from 'lucide-react';
import ActionCard from './ActionCard';

interface PriorityActionsSectionProps {
  pendenciasExclusao: number;
  funcionariosPendentes: number;
  empresasConfiguracaoPendente: number;
}

const PriorityActionsSection = ({
  pendenciasExclusao,
  funcionariosPendentes,
  empresasConfiguracaoPendente
}: PriorityActionsSectionProps) => {
  const actions = [
    {
      title: "Novos Funcionários",
      value: funcionariosPendentes,
      description: "Funcionários aguardando ativação",
      icon: UserPlus,
      to: "/#", // Will be implemented in Stage 3
      variant: "warning" as const
    },
    {
      title: "Pendências de Exclusão",
      value: pendenciasExclusao,
      description: "Funcionários aguardando análise de exclusão",
      icon: AlertTriangle,
      to: "/corretora/pendencias-exclusao",
      variant: "urgent" as const
    },
    {
      title: "Empresas para Configurar",
      value: empresasConfiguracaoPendente,
      description: "Empresas com CNPJs pendentes de configuração",
      icon: Settings,
      to: "/corretora/empresas",
      variant: "default" as const
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">🚨 Ações Prioritárias</h2>
          <p className="text-sm text-gray-600">Itens que precisam da sua atenção imediata</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((action) => (
          <ActionCard
            key={action.title}
            title={action.title}
            value={action.value}
            description={action.description}
            icon={action.icon}
            to={action.to}
            variant={action.variant}
          />
        ))}
      </div>
    </div>
  );
};

export default PriorityActionsSection;
