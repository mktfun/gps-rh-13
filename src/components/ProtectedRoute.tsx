
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';

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
    // ✅ CORREÇÃO: Redirect to valid index routes that exist
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'corretora':
        return <Navigate to="/corretora" replace />;
      case 'empresa':
        return <Navigate to="/empresa" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
