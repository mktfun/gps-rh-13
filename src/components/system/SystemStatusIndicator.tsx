
import React from 'react';
import { Wifi, WifiOff, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSystemStatus } from '@/hooks/useSystemStatus';

interface SystemStatusIndicatorProps {
  onClick: () => void;
}

export const SystemStatusIndicator = ({ onClick }: SystemStatusIndicatorProps) => {
  const { status, isLoading } = useSystemStatus();

  const getStatusIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    switch (status.connectionStatus) {
      case 'online':
        return status.systemHealth === 'good' ? 
          <Wifi className="h-4 w-4 text-green-500" /> : 
          <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <Wifi className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (status.connectionStatus === 'offline') return 'text-red-500';
    if (status.systemHealth === 'error') return 'text-red-500';
    if (status.systemHealth === 'warning') return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn("hover:bg-accent", getStatusColor())}
      >
        {getStatusIcon()}
      </Button>
      
      {status.pendingCounts.notifications > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {status.pendingCounts.notifications > 99 ? '99+' : status.pendingCounts.notifications}
        </Badge>
      )}
    </div>
  );
};
