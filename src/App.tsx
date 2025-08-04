
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import RootLayout from "@/components/layout/RootLayout";
import PublicLayout from "@/components/layout/PublicLayout";
import { lazy, Suspense } from "react";
import { DashboardLoadingState } from "@/components/ui/loading-state";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const Login = lazy(() => import("@/pages/auth/Login"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Corretora pages
const Dashboard = lazy(() => import("@/pages/corretora/Dashboard"));
const Empresas = lazy(() => import("@/pages/corretora/Empresas"));
const EmpresaDetalhes = lazy(() => import("@/pages/corretora/EmpresaDetalhes"));
const SegurosVidaEmpresasPage = lazy(() => import("@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage"));
const SegurosVidaCnpjsPage = lazy(() => import("@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage"));
const SegurosVidaPlanoPage = lazy(() => import("@/pages/corretora/seguros-vida/SegurosVidaPlanoPage"));
const FuncionariosPendentes = lazy(() => import("@/pages/corretora/FuncionariosPendentes"));
const AtivarFuncionario = lazy(() => import("@/pages/corretora/AtivarFuncionario"));
const PendenciasExclusao = lazy(() => import("@/pages/corretora/PendenciasExclusao"));
const AuditoriaPage = lazy(() => import("@/pages/corretora/AuditoriaPage"));
const RelatorioFinanceiroPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFinanceiroPage"));
const RelatorioFuncionariosPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioFuncionariosPage"));
const RelatorioMovimentacaoPage = lazy(() => import("@/pages/corretora/relatorios/RelatorioMovimentacaoPage"));

// Empresa pages
const EmpresaDashboard = lazy(() => import("@/pages/empresa/Dashboard"));
const EmpresaFuncionarios = lazy(() => import("@/pages/empresa/Funcionarios"));
const EmpresaPlanosPage = lazy(() => import("@/pages/empresa/EmpresaPlanosPage"));
const EmpresaPlanoDetalhesPage = lazy(() => import("@/pages/empresa/PlanoDetalhesPage"));
const RelatorioCustosEmpresaPage = lazy(() => import("@/pages/empresa/relatorios/RelatorioCustosEmpresaPage"));
const RelatorioFuncionariosEmpresaPage = lazy(() => import("@/pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage"));
const RelatorioPendenciasEmpresaPage = lazy(() => import("@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage"));

// Shared pages
const PerfilPage = lazy(() => import("@/pages/PerfilPage"));
const ConfiguracoesPage = lazy(() => import("@/pages/ConfiguracoesPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));

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
            <Suspense fallback={<DashboardLoadingState />}>
              <Routes>
                {/* --- ROTAS PÚBLICAS --- */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                </Route>

                {/* --- ROTAS PROTEGIDAS (ESTRUTURA CORRETA) --- */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<RootLayout />}>

                    {/* Grupo de Rotas da Corretora */}
                    <Route path="/corretora">
                      <Route index element={<Navigate to="/corretora/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="empresas" element={<Empresas />} />
                      <Route path="empresas/:id" element={<EmpresaDetalhes />} />
                      <Route path="seguros-de-vida" element={<SegurosVidaEmpresasPage />} />
                      <Route path="seguros-de-vida/empresa/:empresaId" element={<SegurosVidaCnpjsPage />} />
                      <Route path="seguros-de-vida/empresa/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
                      <Route path="funcionarios-pendentes" element={<FuncionariosPendentes />} />
                      <Route path="ativar-funcionario" element={<AtivarFuncionario />} />
                      <Route path="pendencias-exclusao" element={<PendenciasExclusao />} />
                      <Route path="auditoria" element={<AuditoriaPage />} />
                      <Route path="relatorio-financeiro" element={<RelatorioFinanceiroPage />} />
                      <Route path="relatorio-funcionarios" element={<RelatorioFuncionariosPage />} />
                      <Route path="relatorio-movimentacao" element={<RelatorioMovimentacaoPage />} />
                    </Route>

                    {/* Grupo de Rotas da Empresa */}
                    <Route path="/empresa">
                      <Route index element={<Navigate to="/empresa/dashboard" replace />} />
                      <Route path="dashboard" element={<EmpresaDashboard />} />
                      <Route path="funcionarios" element={<EmpresaFuncionarios />} />
                      <Route path="planos" element={<EmpresaPlanosPage />} />
                      <Route path="planos/:id" element={<EmpresaPlanoDetalhesPage />} />
                      <Route path="relatorio-custos" element={<RelatorioCustosEmpresaPage />} />
                      <Route path="relatorio-funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
                      <Route path="relatorio-pendencias" element={<RelatorioPendenciasEmpresaPage />} />
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
