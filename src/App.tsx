
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
import { DashboardLoadingState, TableLoadingState, CardLoadingState } from "@/components/ui/loading-state";
import { EnhancedTableSkeleton } from "@/components/ui/enhanced-loading";

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

// ROTAS PARA CORRIGIR 404s - Relatórios existentes
const RelatorioFuncionariosPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFuncionariosPage"));
const RelatorioFinanceiroPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFinanceiroPage"));
const RelatorioMovimentacaoPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioMovimentacaoPage"));

// ROTAS - Seguros de Vida existente
const SegurosVidaEmpresasPage = lazy(() => import("@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage"));

// ROTA - Auditoria existente
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

                    {/* Grupo de Rotas da Corretora - ROTAS CORRIGIDAS COM SUSPENSE */}
                    <Route path="/corretora">
                      <Route index element={<Navigate to="/corretora/dashboard" replace />} />
                      
                      {/* Dashboard com esqueleto de cards */}
                      <Route 
                        path="dashboard" 
                        element={
                          <Suspense fallback={<DashboardLoadingState />}>
                            <Dashboard />
                          </Suspense>
                        } 
                      />
                      
                      {/* Empresas com esqueleto de tabela */}
                      <Route 
                        path="empresas" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={8} columns={6} />}>
                            <Empresas />
                          </Suspense>
                        } 
                      />
                      
                      {/* Detalhes da empresa com esqueleto de cards */}
                      <Route 
                        path="empresas/:id" 
                        element={
                          <Suspense fallback={<CardLoadingState />}>
                            <EmpresaDetalhes />
                          </Suspense>
                        } 
                      />
                      
                      {/* ROTAS DE SEGUROS DE VIDA - CORRIGIDAS COM SUSPENSE */}
                      <Route 
                        path="seguros-de-vida" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={6} columns={5} />}>
                            <SegurosVidaEmpresasPage />
                          </Suspense>
                        } 
                      />
                      
                      {/* ROTAS DE RELATÓRIOS - ADICIONADAS PARA CORRIGIR 404s COM SUSPENSE */}
                      <Route 
                        path="relatorios/funcionarios" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={10} columns={7} />}>
                            <RelatorioFuncionariosPage />
                          </Suspense>
                        } 
                      />
                      
                      <Route 
                        path="relatorios/financeiro" 
                        element={
                          <Suspense fallback={<DashboardLoadingState />}>
                            <RelatorioFinanceiroPage />
                          </Suspense>
                        } 
                      />
                      
                      <Route 
                        path="relatorios/movimentacao" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={8} columns={6} />}>
                            <RelatorioMovimentacaoPage />
                          </Suspense>
                        } 
                      />
                      
                      {/* ROTA DE AUDITORIA - ADICIONADA PARA CORRIGIR 404 COM SUSPENSE */}
                      <Route 
                        path="auditoria" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={12} columns={5} />}>
                            <AuditoriaPage />
                          </Suspense>
                        } 
                      />
                    </Route>

                    {/* Grupo de Rotas da Empresa - APENAS AS ESSENCIAIS COM SUSPENSE */}
                    <Route path="/empresa">
                      <Route index element={<Navigate to="/empresa/dashboard" replace />} />
                      
                      <Route 
                        path="dashboard" 
                        element={
                          <Suspense fallback={<DashboardLoadingState />}>
                            <EmpresaDashboard />
                          </Suspense>
                        } 
                      />
                      
                      <Route 
                        path="funcionarios" 
                        element={
                          <Suspense fallback={<EnhancedTableSkeleton rows={10} columns={8} />}>
                            <EmpresaFuncionarios />
                          </Suspense>
                        } 
                      />
                      
                      <Route 
                        path="planos" 
                        element={
                          <Suspense fallback={<CardLoadingState />}>
                            <EmpresaPlanosPage />
                          </Suspense>
                        } 
                      />
                      
                      <Route 
                        path="planos/:id" 
                        element={
                          <Suspense fallback={<CardLoadingState />}>
                            <EmpresaPlanoDetalhesPage />
                          </Suspense>
                        } 
                      />
                    </Route>

                    {/* Rotas compartilhadas com suspense */}
                    <Route 
                      path="perfil" 
                      element={
                        <Suspense fallback={<CardLoadingState />}>
                          <PerfilPage />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="configuracoes" 
                      element={
                        <Suspense fallback={<CardLoadingState />}>
                          <ConfiguracoesPage />
                        </Suspense>
                      } 
                    />
                    
                    <Route 
                      path="chat" 
                      element={
                        <Suspense fallback={<div className="p-6"><div className="animate-pulse">Carregando chat...</div></div>}>
                          <ChatPage />
                        </Suspense>
                      } 
                    />

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
