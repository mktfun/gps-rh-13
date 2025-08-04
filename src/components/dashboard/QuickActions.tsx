
import React from 'react';
import { AlertTriangle, UserPlus, Settings } from 'lucide-react';
import ActionCard from './ActionCard';

interface QuickActionsProps {
  pendenciasExclusao: number;
  funcionariosPendentes: number;
  empresasConfiguracaoPendente: number;
}

const QuickActions = ({
  pendenciasExclusao,
  funcionariosPendentes,
  empresasConfiguracaoPendente
}: QuickActionsProps) => {
  const actions = [
    {
      title: "Pendências de Exclusão",
      value: pendenciasExclusao,
      description: "Funcionários aguardando análise de exclusão",
      icon: AlertTriangle,
      to: "/corretora/pendencias-exclusao",
      variant: "urgent" as const,
      delay: "0ms"
    },
    {
      title: "Novos Funcionários",
      value: funcionariosPendentes,
      description: "Funcionários pendentes de ativação",
      icon: UserPlus,
      to: "/corretora/funcionarios-pendentes",
      variant: "warning" as const,
      delay: "100ms"
    },
    {
      title: "Configuração Pendente",
      value: empresasConfiguracaoPendente,
      description: "Empresas com CNPJs em configuração",
      icon: Settings,
      to: "/corretora/empresas",
      variant: "default" as const,
      delay: "200ms"
    }
  ];

  const hasActions = actions.some(action => action.value > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-red-500 to-orange-500 rounded-full"></div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">🚨 Ações Necessárias</h2>
          <p className="text-sm text-gray-600">Itens que precisam da sua atenção imediata</p>
        </div>
      </div>

      {hasActions ? (
        <div className="grid gap-6 md:grid-cols-3">
          {actions.map((action) => (
            <div
              key={action.title}
              className="animate-fade-in opacity-0"
              style={{ 
                animationDelay: action.delay,
                animationFillMode: 'forwards'
              }}
            >
              <ActionCard
                title={action.title}
                value={action.value}
                description={action.description}
                icon={action.icon}
                to={action.to}
                variant={action.variant}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Tudo em dia!</h3>
          <p className="text-gray-600">Não há ações pendentes no momento.</p>
        </div>
      )}
    </div>
  );
};

export default QuickActions;
