
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ClickableStatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  className?: string;
}

const ClickableStatCard = ({
  title,
  value,
  icon: Icon,
  description,
  variant = 'default',
  onClick,
  className
}: ClickableStatCardProps) => {
  const variantStyles = {
    default: 'hover:bg-accent/50',
    success: 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10',
    warning: 'border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10',
    destructive: 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10'
  };

  const iconColors = {
    default: 'text-muted-foreground',
    success: 'text-green-500',
    warning: 'text-amber-500',
    destructive: 'text-red-500'
  };

  return (
    <Card 
      className={cn(
        'transition-all duration-200 cursor-pointer',
        variantStyles[variant],
        onClick && 'hover:shadow-md hover:scale-[1.02]',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-4 w-4', iconColors[variant])} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

export default ClickableStatCard;
