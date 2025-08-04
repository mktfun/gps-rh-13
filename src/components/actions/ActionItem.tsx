
import React from 'react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { QuickAction } from '@/hooks/useQuickActions';

interface ActionItemProps {
  action: QuickAction;
  onSelect?: () => void;
}

export const ActionItem = ({ action, onSelect }: ActionItemProps) => {
  const handleSelect = () => {
    action.action();
    onSelect?.();
  };

  return (
    <DropdownMenuItem 
      onSelect={handleSelect}
      disabled={action.disabled}
      className="flex items-center gap-2 cursor-pointer"
    >
      <action.icon className="h-4 w-4" />
      <span>{action.label}</span>
    </DropdownMenuItem>
  );
};
