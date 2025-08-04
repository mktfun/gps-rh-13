
import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
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
    // Redirect to appropriate dashboard based on role
    switch (role) {
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'corretora':
        return <Navigate to="/corretora/dashboard" replace />;
      case 'empresa':
        return <Navigate to="/empresa/dashboard" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
