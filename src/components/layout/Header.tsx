
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import SmartBreadcrumbs from './SmartBreadcrumbs';
import { UserProfileMenu } from './UserProfileMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SystemStatusIndicator } from '@/components/system/SystemStatusIndicator';
import { SystemStatusModal } from '@/components/system/SystemStatusModal';
import { QuickActionsMenu } from '@/components/actions/QuickActionsMenu';

// Componentes de navegação mobile
import { BarChart3, Building2, FileText, Users, Settings, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const MobileNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Determina qual navegação mostrar baseado na rota atual
  const isCorretora = location.pathname.startsWith('/corretora');
  
  if (isCorretora) {
    return (
      <nav className="space-y-2 py-4">
        <Link 
          to="/corretora" 
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
            isActive("/corretora") 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
        
        <Link 
          to="/corretora/empresas" 
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
            isActive("/corretora/empresas") 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <Building2 className="h-4 w-4" />
          <span>Empresas</span>
        </Link>
        
        <Link 
          to="/corretora/dados-planos" 
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
            isActive("/corretora/dados-planos") 
              ? "bg-accent text-accent-foreground" 
              : "hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <FileText className="h-4 w-4" />
          <span>Dados dos Planos</span>
        </Link>
      </nav>
    );
  }
  
  // Navegação para empresa
  return (
    <nav className="space-y-2 py-4">
      <Link 
        to="/empresa" 
        className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
          isActive("/empresa") 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <BarChart3 className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      
      <Link 
        to="/empresa/funcionarios" 
        className={cn(
          "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
          isActive("/empresa/funcionarios") 
            ? "bg-accent text-accent-foreground" 
            : "hover:bg-accent hover:text-accent-foreground"
        )}
      >
        <Users className="h-4 w-4" />
        <span>Funcionários</span>
      </Link>
    </nav>
  );
};

export const Header = () => {
  const isMobile = useIsMobile();
  const [isSystemStatusModalOpen, setIsSystemStatusModalOpen] = useState(false);

  const handleSystemStatusClick = () => {
    setIsSystemStatusModalOpen(true);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
      {/* Grupo da Esquerda: Menu Mobile + Breadcrumbs */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">CorporateHR</span>
                  </div>
                </SheetTitle>
                <SheetDescription>
                  Navegação
                </SheetDescription>
              </SheetHeader>
              <MobileNavigation />
            </SheetContent>
          </Sheet>
        )}
        
        <div className="min-w-0 flex-1">
          <SmartBreadcrumbs />
        </div>
      </div>

      {/* Grupo da Direita: Ações + Notificações + Perfil */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickActionsMenu />
        <SystemStatusIndicator onClick={handleSystemStatusClick} />
        <NotificationCenter />
        <UserProfileMenu />
      </div>

      {/* System Status Modal */}
      <SystemStatusModal 
        isOpen={isSystemStatusModalOpen}
        onClose={() => setIsSystemStatusModalOpen(false)}
      />
    </header>
  );
};
