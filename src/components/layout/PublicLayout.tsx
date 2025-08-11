
import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLoadingState } from "@/components/ui/loading-state";
import { getDashboardRoute } from "@/utils/routePaths";

const PublicLayout = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  // If user is authenticated, redirect to their role-based dashboard
  if (isAuthenticated) {
    const dashboardRoute = getDashboardRoute(role);
    return <Navigate to={dashboardRoute} replace />;
  }

  // If not authenticated, render the public route
  return <Outlet />;
};

export default PublicLayout;
