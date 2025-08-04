
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLoadingState } from "@/components/ui/loading-state";

const PublicLayout = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  // If user is authenticated, redirect to their role-based dashboard
  if (isAuthenticated) {
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

  // If not authenticated, render the public route
  return <Outlet />;
};

export default PublicLayout;
