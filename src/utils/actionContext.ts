
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export interface ActionContext {
  userRole: 'corretora' | 'empresa' | 'admin' | null;
  currentRoute: string;
  routeParams: {
    empresaId?: string;
    cnpjId?: string;
    planoId?: string;
  };
  contextType: 'dashboard' | 'empresas' | 'empresa-detalhes' | 'cnpjs' | 'funcionarios' | 'planos' | 'relatorios' | 'configuracoes' | 'other';
}

export const useActionContext = (): ActionContext => {
  const location = useLocation();
  const { role } = useAuth();
  
  const pathname = location.pathname;
  const segments = pathname.split('/').filter(Boolean);

  // Extract route parameters
  const routeParams: ActionContext['routeParams'] = {};
  
  if (segments.includes('empresa') && segments[segments.indexOf('empresa') + 1]) {
    routeParams.empresaId = segments[segments.indexOf('empresa') + 1];
  }
  
  if (segments.includes('cnpj') && segments[segments.indexOf('cnpj') + 1]) {
    routeParams.cnpjId = segments[segments.indexOf('cnpj') + 1];
  }
  
  if (segments.includes('planos') && segments[segments.indexOf('planos') + 1]) {
    routeParams.planoId = segments[segments.indexOf('planos') + 1];
  }

  // Determine context type
  let contextType: ActionContext['contextType'] = 'other';
  
  if (pathname.includes('/dashboard')) {
    contextType = 'dashboard';
  } else if (pathname.includes('/empresas') && !routeParams.empresaId) {
    contextType = 'empresas';
  } else if (routeParams.empresaId && !pathname.includes('/cnpj')) {
    contextType = 'empresa-detalhes';
  } else if (pathname.includes('/cnpj') || pathname.includes('/dados-planos')) {
    contextType = 'cnpjs';
  } else if (pathname.includes('/funcionarios')) {
    contextType = 'funcionarios';
  } else if (pathname.includes('/plano')) {
    contextType = 'planos';
  } else if (pathname.includes('/relatorios')) {
    contextType = 'relatorios';
  } else if (pathname.includes('/configuracoes')) {
    contextType = 'configuracoes';
  }

  return {
    userRole: role as 'corretora' | 'empresa' | 'admin' | null,
    currentRoute: pathname,
    routeParams,
    contextType,
  };
};
