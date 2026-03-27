import React, { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import SmartBreadcrumbs from './SmartBreadcrumbs';
import { UserProfileMenu } from './UserProfileMenu';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { SystemStatusIndicator } from '@/components/system/SystemStatusIndicator';
import { SystemStatusModal } from '@/components/system/SystemStatusModal';
import { QuickActionsMenu } from '@/components/actions/QuickActionsMenu';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import { MobileNav } from './MobileNav';

export const Header = () => {
  const isMobile = useIsMobile();
  const [isSystemStatusModalOpen, setIsSystemStatusModalOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSystemStatusClick = () => {
    setIsSystemStatusModalOpen(true);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-50">
      {/* Grupo da Esquerda: Menu Mobile + Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <MobileNav />
        
        <div className="min-w-0 flex-1">
          <SmartBreadcrumbs />
        </div>
      </div>

      {/* Grupo do Centro: Barra de Busca Global */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar empresas, funcionários, relatórios..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10 w-full bg-muted/50 border-muted focus:bg-background transition-colors"
          />
        </div>
      </div>

      {/* Grupo da Direita: Ações + Theme Toggle + Notificações + Perfil */}
      <div className="flex items-center gap-2 shrink-0">
        <QuickActionsMenu />
        <SystemStatusIndicator onClick={handleSystemStatusClick} />
        <ThemeToggle />
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
