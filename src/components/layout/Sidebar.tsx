import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/utils/routePaths';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  Settings, 
  User,
  Shield,
  ClipboardList,
  DollarSign,
  Activity,
  Calendar,
  Stethoscope,
  MapPin
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  const { role } = useAuth();

  const isActive = (path: string) => location.pathname === path;

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

  // Corretora navigation - Principal (apenas o essencial)
  const corretoraNavigation = [
    {
      name: 'Dashboard',
      href: '/corretora/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Empresas',
      href: '/corretora/empresas',
      icon: Building2,
    },
  ];

  // Corretora navigation - Operacional (dia a dia)
  const corretoraOperacional = [
    {
      name: 'Relatório de Pendências',
      href: '/corretora/relatorios/pendencias',
      icon: ClipboardList,
    },
    {
      name: 'Auditoria',
      href: '/corretora/auditoria',
      icon: Shield,
    },
  ];

  const corretoraPlanos = [
    {
      name: 'Seguros de Vida',
      href: '/corretora/seguros-de-vida/empresas',
      icon: Activity,
    },
    {
      name: 'Planos de Saúde',
      href: '/corretora/planos-de-saude/empresas',
      icon: Stethoscope,
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
  ];

  const empresaPlanos = [
    {
      name: 'Seguros de Vida',
      href: '/empresa/seguros-de-vida',
      icon: Activity,
    },
    {
      name: 'Planos de Saúde',
      href: '/empresa/planos-de-saude',
      icon: Stethoscope,
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

  const renderNavItem = (item: any) => (
    <Link
      key={item.href}
      to={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive(item.href) 
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm' 
          : 'text-sidebar-foreground'
      )}
    >
      <item.icon className={cn(
        "h-4 w-4 transition-all duration-200",
        isActive(item.href) 
          ? 'text-sidebar-primary-foreground' 
          : 'text-sidebar-foreground group-hover:text-sidebar-accent-foreground'
      )} />
      <span className="truncate">{item.name}</span>
      {item.badge && <Badge variant="secondary" className="ml-auto">{item.badge}</Badge>}
    </Link>
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="space-y-1">
      <div className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {items.map(item => renderNavItem(item))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar-background border-r border-sidebar-border">
      {/* Logo Header */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <Link 
          className="flex items-center gap-3 font-bold text-sidebar-foreground hover:text-sidebar-primary transition-colors" 
          to={getDashboardRoute(role)}
        >
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold">GPS</span>
            <span className="text-xs text-sidebar-foreground/60">Gestor Planos de Saúde</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-4">
        <div className="flex flex-col gap-6 py-6">
          {/* Role-specific navigation */}
          {role === 'admin' && (
            <div className="space-y-4">
              {renderSection('Principal', adminNavigation)}
            </div>
          )}

          {role === 'corretora' && (
            <div className="space-y-6">
              {renderSection('Principal', corretoraNavigation)}
              <Separator className="bg-sidebar-border" />
              {renderSection('Operacional', corretoraOperacional)}
              <Separator className="bg-sidebar-border" />
              {renderSection('Planos', corretoraPlanos)}
              <Separator className="bg-sidebar-border" />
              {renderSection('Relatórios', corretoraRelatorios)}
            </div>
          )}

          {role === 'empresa' && (
            <div className="space-y-6">
              {renderSection('Principal', empresaNavigation)}
              <Separator className="bg-sidebar-border" />
              {renderSection('Planos', empresaPlanos)}
              <Separator className="bg-sidebar-border" />
              {renderSection('Relatórios', empresaRelatorios)}
            </div>
          )}

          {/* Shared navigation */}
          <Separator className="bg-sidebar-border" />
          {renderSection('Configurações', sharedNavigation)}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
