
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface TipoPendenciaBadgeProps {
  tipo: 'documentacao' | 'ativacao' | 'alteracao' | 'cancelamento';
}

export const TipoPendenciaBadge: React.FC<TipoPendenciaBadgeProps> = ({ tipo }) => {
  const configs = {
    documentacao: {
      label: 'Documentação',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    },
    ativacao: {
      label: 'Ativação',
      className: 'bg-green-100 text-green-800 border-green-200'
    },
    alteracao: {
      label: 'Alteração',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    },
    cancelamento: {
      label: 'Cancelamento',
      className: 'bg-red-100 text-red-800 border-red-200'
    }
  };

  const config = configs[tipo];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

interface PrioridadePendenciaBadgeProps {
  prioridade: 'critica' | 'urgente' | 'normal';
}

export const PrioridadePendenciaBadge: React.FC<PrioridadePendenciaBadgeProps> = ({ prioridade }) => {
  const configs = {
    critica: {
      label: 'Crítica',
      className: 'bg-red-100 text-red-800 border-red-200'
    },
    urgente: {
      label: 'Urgente',
      className: 'bg-orange-100 text-orange-800 border-orange-200'
    },
    normal: {
      label: 'Normal',
      className: 'bg-blue-100 text-blue-800 border-blue-200'
    }
  };

  const config = configs[prioridade];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};
