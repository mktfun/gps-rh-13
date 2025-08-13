import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SmartBreadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const breadcrumbNameMap: Record<string, string> = {
    'admin': 'Administração',
    'dashboard': 'Dashboard',
    'corretoras': 'Corretoras',
    'corretora': 'Corretora',
    'empresa': 'Empresa',
    'empresas': 'Empresas',
    'funcionarios': 'Funcionários',
    'seguros-de-vida': 'Seguros de Vida',
    'planos-de-saude': 'Planos de Saúde',
    'cnpjs': 'CNPJs',
    'cnpj': 'CNPJ',
    'plano': 'Plano',
    'relatorios': 'Relatórios',
    'financeiro': 'Financeiro',
    'movimentacao': 'Movimentação',
    'pendencias': 'Pendências',
    'auditoria': 'Auditoria',
    'ativar-funcionario': 'Ativar Funcionário',
    'perfil': 'Perfil',
    'configuracoes': 'Configurações',
    'custos-empresa': 'Custos da Empresa',
    'custos-detalhado': 'Custos Detalhado',
    'funcionarios-detalhado': 'Funcionários Detalhado',
    'planos': 'Planos',
    'planos-saude': 'Planos de Saúde',
    'seguros-vida': 'Seguros de Vida'
  };

  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const buildBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentPath = '';

    // Home/Dashboard sempre primeiro
    breadcrumbs.push({
      name: 'Home',
      path: '/',
      icon: <Home className="h-4 w-4" />
    });

    pathnames.forEach((pathname, index) => {
      currentPath += `/${pathname}`;
      const isLast = index === pathnames.length - 1;
      
      // Skip UUIDs nos breadcrumbs (mas mantém no path)
      if (isUUID(pathname)) {
        return;
      }

      let displayName = breadcrumbNameMap[pathname] || pathname;
      let linkPath = currentPath;

      // Casos especiais para links corretos
      if (pathname === 'seguros-de-vida' && pathnames[0] === 'corretora') {
        linkPath = '/corretora/seguros-de-vida/empresas';
      }

      breadcrumbs.push({
        name: displayName,
        path: linkPath,
        isLast
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={`${breadcrumb.path}-${index}`} className="contents">
            <BreadcrumbItem>
              {breadcrumb.isLast ? (
                <BreadcrumbPage className="flex items-center gap-1">
                  {breadcrumb.icon}
                  {breadcrumb.name}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={breadcrumb.path} className="flex items-center gap-1 hover:text-foreground">
                    {breadcrumb.icon}
                    {breadcrumb.name}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {index < breadcrumbs.length - 1 && (
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
            )}
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default SmartBreadcrumbs;
