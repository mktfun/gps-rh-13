
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedCorretoraRoute from "@/components/ProtectedCorretoraRoute";

// Pages - Fixed paths to match actual file structure
import Index from "@/pages/Index";
import Login from "@/pages/auth/Login";
import Dashboard from "@/pages/corretora/Dashboard";
import Empresas from "@/pages/corretora/Empresas";
import EmpresaDetalhes from "@/pages/corretora/EmpresaDetalhes";
import Configuracoes from "@/pages/ConfiguracoesPage";
import { ChatPage } from "@/pages/ChatPage";

// Chat Widget
import { ChatWidget } from "@/components/chat/ChatWidget";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (error?.message?.includes('JWT')) return false;
        return failureCount < 3;
      },
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/empresas" element={<ProtectedCorretoraRoute><Empresas /></ProtectedCorretoraRoute>} />
              <Route path="/empresas/:id" element={<ProtectedCorretoraRoute><EmpresaDetalhes /></ProtectedCorretoraRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            
            {/* Chat Widget - positioned globally */}
            <ChatWidget />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
