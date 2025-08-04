import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Building2, FileText, Users, Settings, User, GanttChartSquare, HeartPulse, Shield, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

// Configuração centralizada para Corretora
const corretoraNavItems = [
  { href: '/corretora', label: 'Dashboard', icon: BarChart3 },
  { href: '/corretora/empresas', label: 'Empresas', icon: Building2 },
];

const corretoraPlanos = [
  { href: '/corretora/seguros-de-vida', label: 'Seguros de Vida', icon: Shield },
  { href: '/corretora/planos-saude', label: 'Planos de Saúde', icon: HeartPulse, disabled: true },
];

const corretoraRelatorios = [
  { href: '/corretora/relatorios/funcionarios', label: 'Funcionários', icon: Users },
  { href: '/corretora/relatorios/financeiro', label: 'Financeiro', icon: BarChart3 },
  { href: '/corretora/relatorios/movimentacao', label: 'Movimentação', icon: GanttChartSquare },
  { href: '/corretora/auditoria', label: 'Auditoria', icon: FileText },
];

const corretoraConfiguracao = [
  { href: '/corretora/perfil', label: 'Perfil', icon: User },
  { href: '/corretora/configuracoes', label: 'Configurações', icon: Settings },
];

// Configuração centralizada para Empresa
const empresaNavItems = [
  { href: '/empresa', label: 'Dashboard', icon: BarChart3 },
  { href: '/empresa/funcionarios', label: 'Funcionários', icon: Users },
];

const empresaPlanos = [
  { href: '/empresa/planos', label: 'Seguros de Vida', icon: Shield },
  { href: '/empresa/planos-saude', label: 'Planos de Saúde', icon: HeartPulse, disabled: true },
];

const empresaRelatorios = [
  { href: '/empresa/relatorios/funcionarios', label: 'Funcionários', icon: Users, disabled: true },
  { href: '/empresa/relatorios/custos', label: 'Custos Detalhado', icon: DollarSign, disabled: true },
  { href: '/empresa/relatorios/pendencias', label: 'Pendências', icon: FileText, disabled: true },
];

const empresaConfiguracao = [
  { href: '/empresa/perfil', label: 'Perfil', icon: User },
  { href: '/empresa/configuracoes', label: 'Configurações', icon: Settings },
];

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}

interface NavSectionProps {
  title?: string;
  items: NavItem[];
  isActive: (path: string) => boolean;
  onLinkHover?: (href: string) => void;
}

// Sub-componente reutilizável NavSection with prefetching
const NavSection: React.FC<NavSectionProps> = ({ title, items, isActive, onLinkHover }) => (
  <div className="py-2">
    {title && <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">{title}</h2>}
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        
        if (item.disabled) {
          return (
            <div
              key={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground opacity-50 cursor-not-allowed"
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
              <span className="text-xs bg-muted px-2 py-1 rounded">Em breve</span>
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            to={item.href}
            onMouseEnter={() => onLinkHover?.(item.href)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              isActive(item.href) && "bg-muted text-primary font-semibold"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </div>
  </div>
);

const CorretoraNav: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/corretora') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLinkHover = (href: string) => {
    if (!user?.id) return;

    // Prefetch data based on the route being hovered
    switch (href) {
      case '/corretora':
        // Prefetch corretora dashboard metrics
        queryClient.prefetchQuery({
          queryKey: ['corretoraDashboardMetrics', user.id],
          staleTime: 1000 * 60 * 2,
        });
        break;
        
      case '/corretora/empresas':
        // Prefetch empresas data
        queryClient.prefetchQuery({
          queryKey: ['empresas-com-metricas', '', 1, 10, 'created_at', 'desc'],
          staleTime: 1000 * 60 * 5,
        });
        break;
        
      case '/corretora/seguros-de-vida':
        // Prefetch seguros de vida empresas data
        queryClient.prefetchQuery({
          queryKey: ['empresas-com-metricas', '', 1, 10, 'created_at', 'desc'],
          staleTime: 1000 * 60 * 5,
        });
        break;
        
      case '/corretora/relatorios/financeiro':
        // Prefetch relatório financeiro data
        queryClient.prefetchQuery({
          queryKey: ['relatorio-financeiro-corretora', user.id],
          staleTime: 1000 * 60 * 2,
        });
        break;
        
      case '/corretora/relatorios/funcionarios':
        // Prefetch relatório funcionários data
        queryClient.prefetchQuery({
          queryKey: ['relatorio-funcionarios', user.id, '', 1, 25, 'nome', 'asc'],
          staleTime: 1000 * 60 * 2,
        });
        break;
        
      case '/corretora/relatorios/movimentacao':
        // Prefetch relatório movimentação data
        queryClient.prefetchQuery({
          queryKey: ['relatorio-movimentacao', user.id],
          staleTime: 1000 * 60 * 2,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <NavSection items={corretoraNavItems} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Planos" items={corretoraPlanos} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Relatórios" items={corretoraRelatorios} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Conta" items={corretoraConfiguracao} isActive={isActive} onLinkHover={handleLinkHover} />
    </div>
  );
};

const EmpresaNav: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/empresa') return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLinkHover = (href: string) => {
    if (!user?.id) return;

    // Prefetch data based on the route being hovered
    switch (href) {
      case '/empresa':
        // Prefetch empresa dashboard metrics
        queryClient.prefetchQuery({
          queryKey: ['empresa-dashboard', user.id],
          staleTime: 2 * 60 * 1000,
        });
        break;
        
      case '/empresa/funcionarios':
        // Prefetch empresa funcionários data
        queryClient.prefetchQuery({
          queryKey: ['empresa-funcionarios', user.id],
          staleTime: 1000 * 60 * 5,
        });
        break;
        
      case '/empresa/planos':
        // Prefetch empresa planos data
        queryClient.prefetchQuery({
          queryKey: ['empresa-planos-unificados', user.id],
          staleTime: 1000 * 60 * 5,
        });
        break;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <NavSection items={empresaNavItems} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Planos" items={empresaPlanos} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Relatórios" items={empresaRelatorios} isActive={isActive} onLinkHover={handleLinkHover} />
      <Separator />
      <NavSection title="Conta" items={empresaConfiguracao} isActive={isActive} onLinkHover={handleLinkHover} />
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { role, branding } = useAuth();

  const renderLogo = () => {
    if (branding?.logo_url) {
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={branding.logo_url} alt="Logo da Corretora" />
            <AvatarFallback>C</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-lg">CorporateHR</span>
        </div>
      );
    }
    return <span className="font-semibold text-lg">CorporateHR</span>;
  };

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-center border-b pb-4">
        {renderLogo()}
      </div>
      <div className="flex-1 overflow-auto">
        {role === 'corretora' && <CorretoraNav />}
        {role === 'empresa' && <EmpresaNav />}
      </div>
    </div>
  );
};
