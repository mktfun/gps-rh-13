
import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RootLayout from "@/components/layout/RootLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { DashboardLoadingState } from "@/components/ui/loading-state";

// Debug React availability
console.log('🔍 React availability check:', {
  React: typeof React !== 'undefined' ? 'Available' : 'Not available',
  Suspense: typeof Suspense !== 'undefined' ? 'Available' : 'Not available',
  lazy: typeof lazy !== 'undefined' ? 'Available' : 'Not available'
});

// PÁGINAS EXISTENTES
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Corretora pages - essenciais existentes
const Dashboard = lazy(() => import("@/pages/corretora/Dashboard"));
const Empresas = lazy(() => import("@/pages/corretora/Empresas"));
const EmpresaDetalhes = lazy(() => import("@/pages/corretora/EmpresaDetalhes"));

// NOVAS ROTAS PARA CORRIGIR 404s - Relatórios existentes
const RelatorioFuncionariosPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFuncionariosPage"));
const RelatorioFinanceiroPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFinanceiroPage"));
const RelatorioMovimentacaoPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioMovimentacaoPage"));

// NOVAS ROTAS - Seguros de Vida existente
const SegurosVidaEmpresasPage = lazy(() => import("@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage"));

// NOVA ROTA - Auditoria existente
const AuditoriaPage = lazy(() => import("@/pages/corretora/AuditoriaPage"));

// Empresa pages - apenas as essenciais
const EmpresaDashboard = lazy(() => import("@/pages/empresa/Dashboard"));
const EmpresaFuncionarios = lazy(() => import("@/pages/empresa/Funcionarios"));
const EmpresaPlanosPage = lazy(() => import("@/pages/empresa/EmpresaPlanosPage"));
const EmpresaPlanoDetalhesPage = lazy(() => import("@/pages/empresa/PlanoDetalhesPage"));

// Shared pages - apenas as essenciais
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const ConfiguracoesPage = lazy(() => import("@/pages/ConfiguracoesPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));

// Create QueryClient with additional debugging
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        console.log('🔄 Query retry:', { failureCount, error: error?.message });
        if (error?.message?.includes('JWT')) return false;
        return failureCount < 3;
      },
    },
  },
});

console.log('🔍 QueryClient created successfully:', !!queryClient);

function App() {
  console.log('🚀 App component rendering...');
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" />
          <BrowserRouter>
            <Suspense fallback={<DashboardLoadingState />}>
              <Routes>
                {/* --- ROTAS PÚBLICAS --- */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                </Route>

                {/* --- ROTAS PROTEGIDAS (ESTRUTURA CORRETA) --- */}
                <Route element={<ProtectedRoute />}>
                  <Route element={
                    <ErrorBoundary>
                      <RootLayout />
                    </ErrorBoundary>
                  }>

                    {/* Grupo de Rotas da Corretora - ROTAS CORRIGIDAS */}
                    <Route path="/corretora">
                      <Route index element={<Navigate to="/corretora/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="empresas" element={<Empresas />} />
                      <Route path="empresas/:id" element={<EmpresaDetalhes />} />
                      
                      {/* ROTAS DE SEGUROS DE VIDA - CORRIGIDAS */}
                      <Route path="seguros-de-vida" element={<SegurosVidaEmpresasPage />} />
                      
                      {/* ROTAS DE RELATÓRIOS - ADICIONADAS PARA CORRIGIR 404s */}
                      <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
                      <Route path="relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
                      <Route path="relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
                      
                      {/* ROTA DE AUDITORIA - ADICIONADA PARA CORRIGIR 404 */}
                      <Route path="auditoria" element={<AuditoriaPage />} />
                    </Route>

                    {/* Grupo de Rotas da Empresa - APENAS AS ESSENCIAIS */}
                    <Route path="/empresa">
                      <Route index element={<Navigate to="/empresa/dashboard" replace />} />
                      <Route path="dashboard" element={<EmpresaDashboard />} />
                      <Route path="funcionarios" element={<EmpresaFuncionarios />} />
                      <Route path="planos" element={<EmpresaPlanosPage />} />
                      <Route path="planos/:id" element={<EmpresaPlanoDetalhesPage />} />
                    </Route>

                    {/* Rotas compartilhadas */}
                    <Route path="perfil" element={<PerfilPage />} />
                    <Route path="configuracoes" element={<ConfiguracoesPage />} />
                    <Route path="chat" element={<ChatPage />} />

                  </Route>
                </Route>

                {/* --- ROTA 404 --- */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
