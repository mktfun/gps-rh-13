import React from 'react';
import { cn } from '@/lib/utils';
import { MetricCardProps } from '@/types/dashboard';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MetricCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-8 bg-gray-200 rounded w-16"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
    </div>
  </div>
);

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'neutral' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    case 'down':
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    default:
      return <Minus className="h-4 w-4 text-gray-400" />;
  }
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  loading, 
  className,
  onClick 
}: MetricCardProps) {
  if (loading) {
    return <MetricCardSkeleton />;
  }
  
  const isClickable = !!onClick;
  
  return (
    <div 
      className={cn(
        "bg-white p-6 rounded-lg shadow-sm border transition-all duration-200",
        isClickable && "hover:shadow-md hover:scale-105 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            {trend && <TrendIcon trend={trend} />}
          </div>
          
          <p className="text-2xl font-bold text-gray-900 mb-1">
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </p>
          
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
