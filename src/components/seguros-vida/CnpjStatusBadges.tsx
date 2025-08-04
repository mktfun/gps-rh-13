
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, Clock } from 'lucide-react';

interface CnpjStatusBadgeProps {
  status: string;
}

export const CnpjStatusBadge: React.FC<CnpjStatusBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ativo':
        return {
          variant: 'default' as const,
          icon: Check,
          label: 'Ativo',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'configuracao':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Configuração',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'inativo':
        return {
          variant: 'destructive' as const,
          icon: X,
          label: 'Inativo',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: Clock,
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
};

interface PlanoStatusBadgeProps {
  temPlano: boolean;
}

export const PlanoStatusBadge: React.FC<PlanoStatusBadgeProps> = ({ temPlano }) => {
  if (temPlano) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
        <Check className="h-3 w-3 mr-1" />
        Sim
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
      <X className="h-3 w-3 mr-1" />
      Não
    </Badge>
  );
};

interface PendenciasBadgeProps {
  total: number;
  pendentes?: number;
  exclusaoSolicitada?: number;
}

export const PendenciasBadge: React.FC<PendenciasBadgeProps> = ({ 
  total, 
  pendentes = 0, 
  exclusaoSolicitada = 0 
}) => {
  if (total === 0) {
    return null;
  }

  const getTooltipText = () => {
    const parts = [];
    if (pendentes > 0) parts.push(`${pendentes} pendente(s)`);
    if (exclusaoSolicitada > 0) parts.push(`${exclusaoSolicitada} exclusão solicitada`);
    return parts.join(', ');
  };

  return (
    <Badge 
      variant="secondary" 
      className="bg-yellow-100 text-yellow-800 border-yellow-200"
      title={getTooltipText()}
    >
      <AlertTriangle className="h-3 w-3 mr-1" />
      {total} pendência{total !== 1 ? 's' : ''}
    </Badge>
  );
};

// Componente principal que agrupa os badges
interface CnpjStatusBadgesProps {
  temPlano: boolean;
  funcionariosAtivos: number;
  totalFuncionarios: number;
  totalPendencias?: number;
  funcionariosPendentes?: number;
  funcionariosExclusaoSolicitada?: number;
}

export const CnpjStatusBadges: React.FC<CnpjStatusBadgesProps> = ({
  temPlano,
  funcionariosAtivos,
  totalFuncionarios,
  totalPendencias = 0,
  funcionariosPendentes = 0,
  funcionariosExclusaoSolicitada = 0
}) => {
  return (
    <div className="flex flex-wrap gap-2">
      <PlanoStatusBadge temPlano={temPlano} />
      {totalPendencias > 0 && (
        <PendenciasBadge 
          total={totalPendencias}
          pendentes={funcionariosPendentes}
          exclusaoSolicitada={funcionariosExclusaoSolicitada}
        />
      )}
    </div>
  );
};
