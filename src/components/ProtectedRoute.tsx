
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { getDashboardRoute } from '@/utils/routePaths';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles, children }) => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!isAuthenticated) {
    // Redirect to login with return path
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(role || '')) {
    // Redirect to correct dashboard based on role
    const dashboardRoute = getDashboardRoute(role);
    return <Navigate to={dashboardRoute} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
