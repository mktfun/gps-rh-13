
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationBellProps {
  onClick: () => void;
}

export const NotificationBell = ({ onClick }: NotificationBellProps) => {
  const { unreadCount, isLoading } = useNotifications();

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className="hover:bg-accent"
        disabled={isLoading}
      >
        <Bell className="h-5 w-5" />
      </Button>
      
      {unreadCount > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </div>
  );
};
