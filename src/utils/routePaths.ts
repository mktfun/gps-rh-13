
export const DASHBOARD_ROUTES = {
  admin: '/admin/dashboard',
  corretora: '/corretora/dashboard',
  empresa: '/empresa/dashboard',
} as const;

export const getDashboardRoute = (role: string | null): string => {
  switch (role) {
    case 'admin':
      return DASHBOARD_ROUTES.admin;
    case 'corretora':
      return DASHBOARD_ROUTES.corretora;
    case 'empresa':
      return DASHBOARD_ROUTES.empresa;
    default:
      return '/login';
  }
};
