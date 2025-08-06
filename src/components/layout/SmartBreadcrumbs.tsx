import React from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useEmpresa } from '@/hooks/useEmpresa';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';

export const SmartBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const { id: empresaId, funcionarioId, planoId, cnpjId } = params;

  // Hooks condicionais baseados na rota
  const { data: empresa } = useEmpresa(empresaId);
  const { data: plano } = usePlanoDetalhes(planoId || cnpjId || '');

  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [];

    // Sempre adicionar o breadcrumb raiz baseado no contexto
    if (pathSegments[0] === 'corretora') {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/corretora',
      });
    } else if (pathSegments[0] === 'empresa') {
      breadcrumbs.push({
        label: 'Dashboard',
        href: '/empresa',
      });
    }

    // Breadcrumbs específicos para cada rota
    if (pathSegments.includes('empresas')) {
      breadcrumbs.push({
        label: 'Empresas',
        href: '/corretora/empresas',
      });

      if (empresaId && empresa) {
        breadcrumbs.push({
          label: empresa.nome,
          href: `/corretora/empresas/${empresaId}`,
        });
      }
    }

    if (pathSegments.includes('seguros-de-vida')) {
      breadcrumbs.push({
        label: 'Seguros de Vida',
        href: '/corretora/seguros-de-vida',
      });

      if (empresaId && empresa) {
        breadcrumbs.push({
          label: empresa.nome,
          href: `/corretora/seguros-de-vida/empresa/${empresaId}`,
        });
      }

      if (cnpjId && plano) {
        breadcrumbs.push({
          label: `Plano ${plano.seguradora}`,
          href: `/corretora/seguros-de-vida/empresa/${empresaId}/cnpj/${cnpjId}`,
        });
      }
    }

    if (pathSegments.includes('dados-planos')) {
      breadcrumbs.push({
        label: 'Dados dos Planos',
        href: '/corretora/dados-planos',
      });
    }

    if (pathSegments.includes('plano') && planoId) {
      breadcrumbs.push({
        label: 'Detalhes do Plano',
        href: `/corretora/plano/${planoId}`,
      });
    }

    if (pathSegments.includes('ativar-funcionario') && funcionarioId) {
      breadcrumbs.push({
        label: 'Ativar Funcionário',
        href: `/corretora/ativar-funcionario/${funcionarioId}`,
      });
    }

    if (pathSegments.includes('funcionarios') && pathSegments[0] === 'empresa') {
      breadcrumbs.push({
        label: 'Funcionários',
        href: '/empresa/funcionarios',
      });
    }

    // Breadcrumbs para planos da empresa
    if (pathSegments.includes('planos') && pathSegments[0] === 'empresa') {
      breadcrumbs.push({
        label: 'Planos',
        href: '/empresa/planos',
      });
    }

    if (pathSegments.includes('planos-saude') && pathSegments[0] === 'empresa') {
      breadcrumbs.push({
        label: 'Planos de Saúde',
        href: '/empresa/planos-saude',
      });
    }

    if (pathSegments.includes('relatorios')) {
      const reportType = pathSegments[pathSegments.length - 1];
      const context = pathSegments[0];
      
      if (reportType === 'funcionarios') {
        breadcrumbs.push({
          label: 'Relatórios',
          href: `/${context}/relatorios`,
        });
        breadcrumbs.push({
          label: 'Funcionários',
          href: `/${context}/relatorios/funcionarios`,
        });
      } else if (reportType === 'custos') {
        breadcrumbs.push({
          label: 'Relatórios',
          href: `/${context}/relatorios`,
        });
        breadcrumbs.push({
          label: 'Custos',
          href: `/${context}/relatorios/custos`,
        });
      } else if (reportType === 'pendencias') {
        breadcrumbs.push({
          label: 'Relatórios',
          href: `/${context}/relatorios`,
        });
        breadcrumbs.push({
          label: 'Pendências',
          href: `/${context}/relatorios/pendencias`,
        });
      } else if (reportType === 'financeiro') {
        breadcrumbs.push({
          label: 'Relatórios',
          href: `/${context}/relatorios`,
        });
        breadcrumbs.push({
          label: 'Financeiro',
          href: `/${context}/relatorios/financeiro`,
        });
      } else if (reportType === 'movimentacao') {
        breadcrumbs.push({
          label: 'Relatórios',
          href: `/${context}/relatorios`,
        });
        breadcrumbs.push({
          label: 'Movimentação',
          href: `/${context}/relatorios/movimentacao`,
        });
      }
    }

    if (pathSegments.includes('auditoria')) {
      breadcrumbs.push({
        label: 'Auditoria',
        href: '/corretora/auditoria',
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={breadcrumb.href}>
              <BreadcrumbItem>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={breadcrumb.href}>
                    {breadcrumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </nav>
  );
};
