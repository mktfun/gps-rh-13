
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  User,
  MessageSquare,
  ChevronDown,
  BarChart3,
  Shield,
  Heart,
  ClipboardList,
  DollarSign,
  Activity,
  AlertTriangle,
  Calendar
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { role } = useAuth();
  const [openSections, setOpenSections] = useState<string[]>(['relatorios']);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (paths: string[]) => paths.some(path => location.pathname.startsWith(path));

  // Admin navigation
  const adminNavigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Corretoras',
      href: '/admin/corretoras',
      icon: Building2,
    },
  ];

  // Corretora navigation
  const corretoraNavigation = [
    {
      name: 'Dashboard',
      href: '/corretora/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Enhanced Dashboard',
      href: '/corretora/enhanced-dashboard',
      icon: Activity,
    },
    {
      name: 'Empresas',
      href: '/corretora/empresas',
      icon: Building2,
    },
    {
      name: 'Funcionários Pendentes',
      href: '/corretora/funcionarios-pendentes',
      icon: Users,
    },
    {
      name: 'Pendências Exclusão',
      href: '/corretora/pendencias-exclusao',
      icon: AlertTriangle,
    },
    {
      name: 'Auditoria',
      href: '/corretora/auditoria',
      icon: Shield,
    },
  ];

  const corretoraRelatorios = [
    {
      name: 'Financeiro',
      href: '/corretora/relatorios/financeiro',
      icon: DollarSign,
    },
    {
      name: 'Funcionários',
      href: '/corretora/relatorios/funcionarios',
      icon: Users,
    },
    {
      name: 'Movimentação',
      href: '/corretora/relatorios/movimentacao',
      icon: Activity,
    },
  ];

  const corretoraSeguroVida = [
    {
      name: 'Empresas',
      href: '/corretora/seguros-de-vida/empresas',
      icon: Building2,
    },
  ];

  // Empresa navigation
  const empresaNavigation = [
    {
      name: 'Dashboard',
      href: '/empresa/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Funcionários',
      href: '/empresa/funcionarios',
      icon: Users,
    },
    {
      name: 'Planos',
      href: '/empresa/planos',
      icon: FileText,
    },
  ];

  const empresaRelatorios = [
    {
      name: 'Funcionários',
      href: '/empresa/relatorios/funcionarios',
      icon: Users,
    },
    {
      name: 'Custos',
      href: '/empresa/relatorios/custos-empresa',
      icon: DollarSign,
    },
    {
      name: 'Pendências',
      href: '/empresa/relatorios/pendencias',
      icon: ClipboardList,
    },
  ];

  // Shared navigation (for all roles)
  const sharedNavigation = [
    {
      name: 'Chat',
      href: '/chat',
      icon: MessageSquare,
    },
    {
      name: 'Perfil',
      href: '/perfil',
      icon: User,
    },
    {
      name: 'Configurações',
      href: '/configuracoes',
      icon: Settings,
    },
  ];

  const renderNavItem = (item: any, isChild = false) => (
    <Link
      key={item.href}
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive(item.href) && 'bg-accent text-accent-foreground',
        isChild && 'ml-4'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.name}
      {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
    </Link>
  );

  const renderCollapsibleSection = (title: string, items: any[], icon: any, sectionKey: string) => {
    const Icon = icon;
    const isOpen = openSections.includes(sectionKey);
    const hasActiveChild = isParentActive(items.map(item => item.href));

    return (
      <Collapsible
        open={isOpen}
        onOpenChange={() => toggleSection(sectionKey)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-between px-3 py-2 text-sm',
              hasActiveChild && 'bg-accent text-accent-foreground'
            )}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-4 w-4" />
              {title}
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 transition-transform duration-200',
                isOpen && 'rotate-180'
              )}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {items.map(item => renderNavItem(item, true))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link className="flex items-center gap-2 font-semibold" to="/dashboard">
          <Heart className="h-6 w-6" />
          <span className="">Seguros App</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {/* Role-specific navigation */}
          {role === 'admin' && (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administração
              </div>
              {adminNavigation.map(item => renderNavItem(item))}
            </div>
          )}

          {role === 'corretora' && (
            <>
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Principal
                </div>
                {corretoraNavigation.map(item => renderNavItem(item))}
              </div>

              <Separator />

              <div className="space-y-1">
                {renderCollapsibleSection('Relatórios', corretoraRelatorios, BarChart3, 'relatorios')}
              </div>

              <Separator />

              <div className="space-y-1">
                {renderCollapsibleSection('Seguros de Vida', corretoraSeguroVida, Heart, 'seguros-vida')}
              </div>
            </>
          )}

          {role === 'empresa' && (
            <>
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Principal
                </div>
                {empresaNavigation.map(item => renderNavItem(item))}
              </div>

              <Separator />

              <div className="space-y-1">
                {renderCollapsibleSection('Relatórios', empresaRelatorios, BarChart3, 'relatorios')}
              </div>
            </>
          )}

          {/* Shared navigation */}
          <Separator />
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Geral
            </div>
            {sharedNavigation.map(item => renderNavItem(item))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
