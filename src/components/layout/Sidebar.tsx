import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { usePendenciasDaCorretora } from '@/hooks/usePendenciasDaCorretora';
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
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
  const { data: pendenciasCorretora } = usePendenciasDaCorretora();
  const { data: pendenciasEmpresa } = usePendenciasEmpresa();
  
  const totalPendencias = pendenciasCorretora?.length ?? 0;
  
  // Corretora: count by tipo_plano
  const vidaCountCorretora = pendenciasCorretora?.filter(p => p.status_db === 'pendente' && (p as any).tipo_plano === 'vida').length ?? 0;
  const saudeCountCorretora = pendenciasCorretora?.filter(p => p.status_db === 'pendente' && (p as any).tipo_plano === 'saude').length ?? 0;
  
  // Empresa: count by tipo_plano
  const vidaCountEmpresa = pendenciasEmpresa?.filter(p => p.status === 'pendente' && p.tipo_plano === 'vida').length ?? 0;
  const saudeCountEmpresa = pendenciasEmpresa?.filter(p => p.status === 'pendente' && p.tipo_plano === 'saude').length ?? 0;

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
      badge: totalPendencias > 0 ? totalPendencias.toString() : undefined,
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
      name: 'CNPJs',
      href: '/empresa/cnpjs',
      icon: Building2,
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
        'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:bg-slate-800 hover:text-slate-50',
        isActive(item.href) 
          ? 'bg-blue-600 text-white shadow-sm' 
          : 'text-slate-400'
      )}
    >
      <item.icon className={cn(
        "h-4 w-4 transition-all duration-200",
        isActive(item.href) 
          ? 'text-white' 
          : 'text-slate-400 group-hover:text-slate-50'
      )} />
      <span className="truncate">{item.name}</span>
      {item.badge && <Badge variant="destructive" className="ml-auto">{item.badge}</Badge>}
    </Link>
  );

  const renderSection = (title: string, items: any[]) => (
    <div className="space-y-1">
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
      </div>
      <div className="space-y-1">
        {items.map(item => renderNavItem(item))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full w-64 flex-col bg-slate-950 text-slate-50 border-r border-slate-800">
      {/* Logo Header */}
      <div className="flex h-16 items-center border-b border-slate-800 px-6">
        <Link 
          className="flex items-center gap-3 font-bold hover:opacity-80 transition-opacity" 
          to={getDashboardRoute(role)}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">GPS</span>
            <span className="text-xs text-slate-400">Gestor Planos de Saúde</span>
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
              {renderSection('Operacional', corretoraOperacional)}
              {renderSection('Planos', corretoraPlanos)}
              {renderSection('Relatórios', corretoraRelatorios)}
            </div>
          )}

          {role === 'empresa' && (
            <div className="space-y-6">
              {renderSection('Principal', empresaNavigation)}
              {renderSection('Planos', empresaPlanos)}
              {renderSection('Relatórios', empresaRelatorios)}
            </div>
          )}

          {/* Shared navigation */}
          <div className="pt-2">
            <Separator className="bg-slate-800 mb-6 hidden" />
            {renderSection('Configurações', sharedNavigation)}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default Sidebar;
