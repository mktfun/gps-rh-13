import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCheck, Inbox, ExternalLink, Bell, Archive } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from './NotificationBell';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';

export const NotificationCenter = () => {
  const [showAll, setShowAll] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isMarkingAllAsRead 
  } = useNotifications(showAll);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    console.log('🔔 Clicou na notificação:', notificationId, 'já lida?', isRead);
    if (!isRead) {
      markAsRead(notificationId);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'funcionario_status_change':
      case 'pendencia_funcionario':
        return '👤';
      case 'funcionario_exclusao_solicitada':
        return '🗑️';
      case 'funcionario_aprovado':
        return '✅';
      case 'funcionario_pendente':
        return '⏳';
      case 'relatorio_pronto':
        return '📊';
      case 'plano_configuracao':
        return '⚙️';
      case 'empresa_nova':
        return '🏢';
      case 'sistema_manutencao':
        return '🔧';
      default:
        return '📬';
    }
  };

  const getNotificationLink = (notification: any) => {
    if (notification.link_url) {
      return notification.link_url;
    }

    switch (notification.type) {
      case 'funcionario_exclusao_solicitada':
      case 'funcionario_status_change':
      case 'pendencia_funcionario':
        return '/corretora/relatorios/funcionarios?status=exclusao_solicitada';
      case 'funcionario_aprovado':
        return '/corretora/relatorios/funcionarios?status=ativo';
      case 'funcionario_pendente':
        return '/corretora/relatorios/funcionarios?status=pendente';
      case 'relatorio_pronto':
        return '/corretora/relatorios/funcionarios';
      case 'plano_configuracao':
        return '/corretora/dados-planos';
      case 'empresa_nova':
        return '/corretora/empresas';
      case 'sistema_manutencao':
        return '/corretora/dashboard';
      default:
        return '/corretora/dashboard';
    }
  };

  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'funcionario_exclusao_solicitada':
      case 'sistema_manutencao':
      case 'pendencia_funcionario':
        return 'border-l-red-500';
      case 'funcionario_pendente':
      case 'plano_configuracao':
        return 'border-l-yellow-500';
      case 'funcionario_aprovado':
      case 'relatorio_pronto':
        return 'border-l-green-500';
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div>
          <NotificationBell onClick={() => {}} />
        </div>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96"
        sideOffset={5}
      >
        <div className="flex items-center justify-between p-3 border-b">
          <div className="font-semibold text-sm flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações {!showAll && unreadCount > 0 && `(${unreadCount} novas)`}
          </div>
          
          {!showAll && unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
              className="h-7 px-2 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between p-3 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <Archive className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {showAll ? 'Todas' : 'Não lidas'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Mostrar arquivadas</span>
            <Switch
              checked={showAll}
              onCheckedChange={setShowAll}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Inbox className="h-8 w-8 mb-2" />
              <p className="text-sm">
                {showAll ? 'Nenhuma notificação' : 'Nenhuma notificação nova'}
              </p>
              <p className="text-xs text-center mt-1">
                {showAll 
                  ? 'Você não possui notificações ainda'
                  : 'Todas as notificações foram lidas'
                }
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((notification) => {
                const linkTo = getNotificationLink(notification);
                const priorityColor = getPriorityColor(notification.type);
                
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-3 p-3 cursor-pointer hover:bg-accent border-l-2",
                      !notification.read && "bg-accent/50",
                      priorityColor
                    )}
                    asChild
                  >
                    <Link 
                      to={linkTo}
                      onClick={() => handleNotificationClick(notification.id, notification.read)}
                      className="w-full"
                    >
                      <div className="text-lg mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          "text-sm leading-relaxed",
                          !notification.read && "font-medium"
                        )}>
                          {notification.message}
                        </p>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                <Link to="/corretora/dashboard">
                  <Bell className="h-3 w-3 mr-1" />
                  Central de notificações
                </Link>
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
