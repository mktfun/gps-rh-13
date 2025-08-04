
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  rows?: number;
  columns?: number;
  className?: string;
  showHeader?: boolean;
}

export const TableLoadingState: React.FC<LoadingStateProps> = ({ 
  rows = 5, 
  columns = 5, 
  className,
  showHeader = true 
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {showHeader && (
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={colIndex} 
                className={cn(
                  "h-10",
                  colIndex === 0 ? "w-32" : "w-24"
                )} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const DashboardLoadingState: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Stats Cards Loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      
      {/* Charts Loading */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-[300px] w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardLoadingState: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("p-6 border rounded-lg space-y-4", className)}>
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-4 border rounded">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};
