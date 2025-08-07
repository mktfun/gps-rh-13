
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { BarChart3, Building2, FileText, Users, Settings, User, GanttChartSquare, HeartPulse, Shield, DollarSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

// Configuração CORRIGIDA para Corretora - Links agora apontam para rotas que EXISTEM
const corretoraNavItems = [
  { href: '/corretora', label: 'Dashboard', icon: BarChart3 }, // CORRIGIDO: aponta para index da corretora
  { href: '/corretora/empresas', label: 'Empresas', icon: Building2 },
];

const corretoraPlanos = [
  { href: '/corretora/seguros-de-vida', label: 'Seguros de Vida', icon: Shield }, // CORRIGIDO: rota existe agora
  { href: '/corretora/planos-saude', label: 'Planos de Saúde', icon: HeartPulse, disabled: true },
];

const corretoraRelatorios = [
  { href: '/corretora/relatorios/funcionarios', label: 'Funcionários', icon: Users }, // CORRIGIDO: rota existe agora
  { href: '/corretora/relatorios/financeiro', label: 'Financeiro', icon: BarChart3 }, // CORRIGIDO: rota existe agora
  { href: '/corretora/relatorios/movimentacao', label: 'Movimentação', icon: GanttChartSquare }, // CORRIGIDO: rota existe agora
  { href: '/corretora/auditoria', label: 'Auditoria', icon: FileText }, // CORRIGIDO: rota existe agora
];

const corretoraConfiguracao = [
  { href: '/perfil', label: 'Perfil', icon: User }, // CORRIGIDO: rota compartilhada existe
  { href: '/configuracoes', label: 'Configurações', icon: Settings }, // CORRIGIDO: rota compartilhada existe
];

// Configuração CORRIGIDA para Empresa - rotas agora apontam para as que existem
const empresaNavItems = [
  { href: '/empresa', label: 'Dashboard', icon: BarChart3 }, // CORRIGIDO: aponta para index da empresa
  { href: '/empresa/funcionarios', label: 'Funcionários', icon: Users },
];

const empresaPlanos = [
  { href: '/empresa/planos', label: 'Seguros de Vida', icon: Shield },
  { href: '/empresa/planos-saude', label: 'Planos de Saúde', icon: HeartPulse, disabled: true },
];

const empresaRelatorios = [
  { href: '/empresa/relatorios/funcionarios', label: 'Funcionários', icon: Users }, // REMOVIDO: disabled flag
  { href: '/empresa/relatorios/custos-detalhado', label: 'Custos Detalhado', icon: DollarSign },
  { href: '/empresa/relatorios/pendencias', label: 'Pendências', icon: FileText, disabled: true },
];

const empresaConfiguracao = [
  { href: '/perfil', label: 'Perfil', icon: User }, // CORRIGIDO: rota compartilhada existe
  { href: '/configuracoes', label: 'Configurações', icon: Settings }, // CORRIGIDO: rota compartilhada existe
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
    if (path === '/corretora') return location.pathname === '/corretora' || location.pathname === '/corretora/';
    return location.pathname.startsWith(path);
  };

  const handleLinkHover = (href: string) => {
    if (!user?.id) return;

    // Prefetch apenas com queryFn implementadas para evitar erros
    switch (href) {
      case '/corretora/empresas':
        // Prefetch empresas data - esta funciona porque tem queryFn
        queryClient.prefetchQuery({
          queryKey: ['empresas-com-metricas', '', 1, 10, 'created_at', 'desc'],
          staleTime: 1000 * 60 * 5,
        });
        break;
      
      // Outros casos removidos para evitar Missing queryFn errors
      default:
        // Não fazer prefetch para rotas sem queryFn implementadas
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
    if (path === '/empresa') return location.pathname === '/empresa' || location.pathname === '/empresa/';
    return location.pathname.startsWith(path);
  };

  const handleLinkHover = (href: string) => {
    if (!user?.id) return;

    // Prefetch apenas com queryFn implementadas para evitar erros
    switch (href) {
      case '/empresa/funcionarios':
        // Este pode funcionar se o hook tiver queryFn implementada
        break;
        
      // Outros casos removidos para evitar Missing queryFn errors
      default:
        // Não fazer prefetch para rotas sem queryFn implementadas
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
