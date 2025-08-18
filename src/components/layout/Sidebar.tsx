import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardRoute } from '@/utils/routePaths';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  FileText, 
  Settings, 
  User,
  BarChart3,
  Shield,
  ClipboardList,
  DollarSign,
  Activity,
  AlertTriangle,
  Calendar,
  Stethoscope
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
    {
      name: 'Visão Geral Empresas',
      href: '/corretora/empresas-overview',
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
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
        isActive(item.href) && 'bg-accent text-accent-foreground'
      )}
    >
      <item.icon className="h-4 w-4" />
      {item.name}
      {item.badge && <Badge variant="secondary">{item.badge}</Badge>}
    </Link>
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="space-y-1">
      <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {title}
      </div>
      {items.map(item => renderNavItem(item))}
    </div>
  );

  return (
    <div className="flex h-full w-64 flex-col bg-background border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Link className="flex items-center gap-2 font-semibold" to={getDashboardRoute(role)}>
          <LayoutDashboard className="h-6 w-6" />
          <span className="">GPS</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-2 p-4">
          {/* Role-specific navigation */}
          {role === 'admin' && (
            <div className="space-y-1">
              {renderSection('Principal', adminNavigation)}
            </div>
          )}

          {role === 'corretora' && (
            <>
              {renderSection('Principal', corretoraNavigation)}
              <Separator />
              {renderSection('Operacional', corretoraOperacional)}
              <Separator />
              {renderSection('Planos', corretoraPlanos)}
              <Separator />
              {renderSection('Relatórios', corretoraRelatorios)}
            </>
          )}

          {role === 'empresa' && (
            <>
              {renderSection('Principal', empresaNavigation)}
              <Separator />
              {renderSection('Planos', empresaPlanos)}
              <Separator />
              {renderSection('Relatórios', empresaRelatorios)}
            </>
          )}

          {/* Shared navigation */}
          <Separator />
          {renderSection('Geral', sharedNavigation)}
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
