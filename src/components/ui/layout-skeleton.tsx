
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const LayoutSkeleton: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-card p-4">
        {/* Logo section */}
        <div className="mb-4 flex items-center gap-2 border-b pb-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-6 w-32" />
        </div>
        
        {/* Navigation sections */}
        <div className="space-y-6">
          {/* Main navigation */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
          
          {/* Planos section */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-lg" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
            </div>
          </div>
          
          {/* Relatórios section */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
          
          {/* Conta section */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-full rounded-lg" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col">
        {/* Header skeleton */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-6">
          <div className="space-y-6">
            {/* Page title */}
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
            
            {/* Stats cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Main content area */}
            <div className="rounded-lg border bg-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
                
                {/* Table skeleton */}
                <div className="space-y-3">
                  {/* Table header */}
                  <div className="grid grid-cols-6 gap-4 border-b pb-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-20" />
                    ))}
                  </div>
                  
                  {/* Table rows */}
                  {Array.from({ length: 8 }).map((_, rowIndex) => (
                    <div key={rowIndex} className="grid grid-cols-6 gap-4 py-2">
                      {Array.from({ length: 6 }).map((_, colIndex) => (
                        <Skeleton 
                          key={colIndex} 
                          className={`h-4 ${
                            colIndex === 0 ? 'w-32' : 
                            colIndex === 1 ? 'w-24' : 
                            colIndex === 2 ? 'w-28' :
                            colIndex === 3 ? 'w-20' :
                            colIndex === 4 ? 'w-16' : 'w-12'
                          }`} 
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
