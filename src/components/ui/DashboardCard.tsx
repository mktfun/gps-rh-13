
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  description?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const DashboardCard = ({ 
  title, 
  icon: Icon, 
  description, 
  children, 
  className,
  onClick
}: DashboardCardProps) => {
  return (
    <div 
      className={cn(
        "bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all duration-300",
        "p-6 space-y-4",
        onClick && "cursor-pointer hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {/* Header */}
      <div className="flex items-center gap-3 pb-2 border-b border-border/50">
        {Icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
};

export default DashboardCard;
