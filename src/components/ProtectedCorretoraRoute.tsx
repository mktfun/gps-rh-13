
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';

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
    // ✅ CORREÇÃO: Redirect to valid index routes that exist
    switch (role) {
      case 'admin':
        return <Navigate to="/admin" replace />;
      case 'empresa':
        return <Navigate to="/empresa" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedCorretoraRoute;
