
import React from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ActionItem } from './ActionItem';
import { useQuickActions } from '@/hooks/useQuickActions';

interface QuickActionsMenuProps {
  onActionExecuted?: () => void;
}

export const QuickActionsMenu = ({ onActionExecuted }: QuickActionsMenuProps) => {
  const { actions, context } = useQuickActions();

  if (!actions.length) return null;

  const getContextLabel = () => {
    switch (context.contextType) {
      case 'dashboard': return 'Dashboard';
      case 'empresas': return 'Empresas';
      case 'empresa-detalhes': return 'Detalhes da Empresa';
      case 'cnpjs': return 'CNPJs e Planos';
      case 'funcionarios': return 'Funcionários';
      case 'planos': return 'Planos';
      case 'relatorios': return 'Relatórios';
      case 'configuracoes': return 'Configurações';
      default: return 'Ações';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="opacity-100 hover:opacity-100 transition-opacity hover:bg-accent"
        >
          <Zap className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Ações Rápidas - {getContextLabel()}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {actions.map((action) => (
          <ActionItem 
            key={action.id} 
            action={action}
            onSelect={onActionExecuted}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
