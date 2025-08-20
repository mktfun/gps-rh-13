import { Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "./Header";
import Sidebar from "./Sidebar";
import { DashboardLoadingState } from "../ui/loading-state";
import { ChatWidget } from "@/components/chat/ChatWidget";

interface RootLayoutProps {
  children?: React.ReactNode;
}

const RootLayout = ({ children }: RootLayoutProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Main Layout Container with new design system */}
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar Container: Fixed width, modern design */}
        <div className="hidden border-r border-border bg-sidebar-background md:flex w-64">
          <div className="flex h-full max-h-screen flex-col">
            <Sidebar />
          </div>
        </div>

        {/* Main Content Container: Flexible, contains header and content */}
        <div className="relative flex flex-1 flex-col overflow-hidden">
          <Header />

          {/* Main Content Area: Scrollable content with modern spacing */}
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6 lg:p-8 space-y-8">
              {children || <Outlet />}
            </div>
          </main>
        </div>
      </div>

      {/* Chat Widget: Floating overlay */}
      <ChatWidget />
    </>
  );
};

export default RootLayout;
