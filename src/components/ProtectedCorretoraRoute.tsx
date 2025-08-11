
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { getDashboardRoute } from '@/utils/routePaths';

interface ProtectedCorretoraRouteProps {
  children?: React.ReactNode;
}

const ProtectedCorretoraRoute: React.FC<ProtectedCorretoraRouteProps> = ({ children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'corretora') {
    // Redirect to correct dashboard based on role
    const dashboardRoute = getDashboardRoute(role);
    return <Navigate to={dashboardRoute} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedCorretoraRoute;
