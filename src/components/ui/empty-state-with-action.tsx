
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateWithActionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyStateWithAction: React.FC<EmptyStateWithActionProps> = ({
  icon: Icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-8 text-center space-y-6",
      className
    )}>
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={primaryAction.onClick} size="lg" className="min-w-[180px]">
          {primaryAction.label}
        </Button>
        {secondaryAction && (
          <Button 
            variant="outline" 
            onClick={secondaryAction.onClick} 
            size="lg"
            className="min-w-[120px]"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
};
