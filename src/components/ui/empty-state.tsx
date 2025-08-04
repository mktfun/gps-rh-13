
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-4",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} className="mt-4">
          {action.label}
        </Button>
      )}
    </div>
  );
};

export const TableEmptyState: React.FC<EmptyStateProps> = (props) => {
  return (
    <div className="border rounded-lg">
      <EmptyState {...props} className="py-12" />
    </div>
  );
};
