
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({ size = 'md', className }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={cn('animate-spin text-primary', sizeClasses[size], className)} />
  );
};

interface EnhancedTableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  animated?: boolean;
}

export const EnhancedTableSkeleton: React.FC<EnhancedTableSkeletonProps> = ({ 
  rows = 5, 
  columns = 7, 
  showHeader = true,
  animated = true 
}) => {
  return (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex space-x-4 px-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={`header-${i}`} 
              className={cn(
                "h-4",
                i === 0 ? "w-32" : i === 1 ? "w-24" : "w-20",
                animated && "animate-pulse"
              )} 
            />
          ))}
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="flex space-x-4 px-4 py-3 border-b">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton 
                key={`cell-${rowIndex}-${colIndex}`} 
                className={cn(
                  "h-6",
                  colIndex === 0 ? "w-32" : 
                  colIndex === 1 ? "w-24" : 
                  colIndex === 2 ? "w-28" :
                  colIndex === 3 ? "w-20" :
                  colIndex === 4 ? "w-16" :
                  colIndex === 5 ? "w-16" : "w-12",
                  animated && "animate-pulse",
                  `animation-delay-${(rowIndex * columns + colIndex) * 100}ms`
                )} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

interface ContentLoaderProps {
  lines?: number;
  className?: string;
}

export const ContentLoader: React.FC<ContentLoaderProps> = ({ lines = 3, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full",
            "animate-pulse"
          )} 
        />
      ))}
    </div>
  );
};
