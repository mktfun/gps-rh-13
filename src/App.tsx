import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import PublicLayout from "./components/layout/PublicLayout";
import RootLayout from "./components/layout/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";
import NotFound from "./pages/NotFound";
import { LayoutSkeleton } from "@/components/ui/layout-skeleton";

// Dynamic imports
const Index = lazy(() => import("./pages/Index"));
const PerfilPage = lazy(() => import("./pages/PerfilPage"));
const ConfiguracoesPage = lazy(() => import("./pages/ConfiguracoesPage"));

// Admin pages
const CorretoraspPage = lazy(() => import("./pages/admin/CorretoraspPage"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));

// Corretora pages
const Dashboard = lazy(() => import("./pages/corretora/Dashboard"));
const EnhancedDashboard = lazy(() => import("./pages/corretora/EnhancedDashboard"));
const Empresas = lazy(() => import("./pages/corretora/Empresas"));
const EmpresaDetalhes = lazy(() => import("./pages/corretora/EmpresaDetalhes"));
const FuncionariosPendentes = lazy(() => import("./pages/corretora/FuncionariosPendentes"));
const AtivarFuncionario = lazy(() => import("./pages/corretora/AtivarFuncionario"));
const PendenciasExclusao = lazy(() => import("./pages/corretora/PendenciasExclusao"));
const PlanoDetalhes = lazy(() => import("./pages/corretora/PlanoDetalhes"));
const DadosPlanos = lazy(() => import("./pages/corretora/DadosPlanos"));
const AuditoriaPage = lazy(() => import("./pages/corretora/AuditoriaPage"));

// Seguros de Vida pages
const SegurosVidaEmpresasPage = lazy(() => import("./pages/corretora/seguros-vida/SegurosVidaEmpresasPage"));
const SegurosVidaCnpjsPage = lazy(() => import("./pages/corretora/seguros-vida/SegurosVidaCnpjsPage"));
const SegurosVidaPlanoPage = lazy(() => import("./pages/corretora/seguros-vida/SegurosVidaPlanoPage"));

// Relatórios Corretora pages
const RelatorioFinanceiroPage = lazy(() => import("./pages/corretora/relatorios/RelatorioFinanceiroPage"));
const RelatorioFuncionariosPage = lazy(() => import("./pages/corretora/relatorios/RelatorioFuncionariosPage"));
const RelatorioMovimentacaoPage = lazy(() => import("./pages/corretora/relatorios/RelatorioMovimentacaoPage"));

// Empresa pages
const EmpresaDashboard = lazy(() => import("./pages/empresa/Dashboard"));
const EmpresaFuncionarios = lazy(() => import("./pages/empresa/Funcionarios"));
const EmpresaPlanosPage = lazy(() => import("./pages/empresa/EmpresaPlanosPage"));
const EmpresaPlanoDetalhesPage = lazy(() => import("./pages/empresa/PlanoDetalhesPage"));

// Relatórios Empresa pages
const RelatorioCustosEmpresaPage = lazy(() => import("./pages/empresa/relatorios/RelatorioCustosEmpresaPage"));
const RelatorioFuncionariosEmpresaPage = lazy(() => import("./pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage"));
const RelatorioPendenciasEmpresaPage = lazy(() => import("./pages/empresa/relatorios/RelatorioPendenciasEmpresaPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<LayoutSkeleton />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
              </Route>

              {/* Protected routes with RootLayout */}
              <Route element={<RootLayout />}>
                {/* Admin routes */}
                <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="corretoras" element={<CorretoraspPage />} />
                </Route>

                {/* Corretora routes */}
                <Route path="/corretora" element={<ProtectedRoute allowedRoles={['corretora']} />}>
                  <Route index element={<Navigate to="/corretora/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
                  <Route path="empresas" element={<Empresas />} />
                  <Route path="empresas/:id" element={<EmpresaDetalhes />} />
                  <Route path="funcionarios-pendentes" element={<FuncionariosPendentes />} />
                  <Route path="ativar-funcionario" element={<AtivarFuncionario />} />
                  <Route path="pendencias-exclusao" element={<PendenciasExclusao />} />
                  <Route path="planos/:id" element={<PlanoDetalhes />} />
                  <Route path="dados-planos" element={<DadosPlanos />} />
                  <Route path="auditoria" element={<AuditoriaPage />} />
                  
                  {/* Seguros de Vida routes */}
                  <Route path="seguros-de-vida" element={<SegurosVidaEmpresasPage />} />
                  <Route path="seguros-vida/empresas" element={<SegurosVidaEmpresasPage />} />
                  <Route path="seguros-vida/cnpjs" element={<SegurosVidaCnpjsPage />} />
                  <Route path="seguros-vida/planos/:id" element={<SegurosVidaPlanoPage />} />
                  <Route path="seguros-de-vida/empresa/:empresaId" element={<SegurosVidaCnpjsPage />} />
                  <Route path="seguros-de-vida/empresa/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
                  
                  {/* Relatórios routes */}
                  <Route path="relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
                  <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
                  <Route path="relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />

                  {/* Shared routes within corretora */}
                  <Route path="home" element={<Index />} />
                  <Route path="perfil" element={<PerfilPage />} />
                  <Route path="configuracoes" element={<ConfiguracoesPage />} />
                </Route>

                {/* Empresa routes */}
                <Route path="/empresa" element={<ProtectedRoute allowedRoles={['empresa']} />}>
                  <Route index element={<Navigate to="/empresa/dashboard" replace />} />
                  <Route path="dashboard" element={<EmpresaDashboard />} />
                  <Route path="funcionarios" element={<EmpresaFuncionarios />} />
                  <Route path="planos" element={<EmpresaPlanosPage />} />
                  <Route path="planos/:id" element={<EmpresaPlanoDetalhesPage />} />
                  
                  {/* Relatórios routes */}
                  <Route path="relatorios/custos" element={<RelatorioCustosEmpresaPage />} />
                  <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
                  <Route path="relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />

                  {/* Shared routes within empresa */}
                  <Route path="home" element={<Index />} />
                  <Route path="perfil" element={<PerfilPage />} />
                  <Route path="configuracoes" element={<ConfiguracoesPage />} />
                </Route>
              </Route>

              {/* Legacy route redirects */}
              <Route path="/home" element={<Navigate to="/corretora/home" replace />} />
              <Route path="/dashboard" element={<Navigate to="/corretora/dashboard" replace />} />
              <Route path="/enhanced-dashboard" element={<Navigate to="/corretora/enhanced-dashboard" replace />} />
              <Route path="/empresas" element={<Navigate to="/corretora/empresas" replace />} />
              <Route path="/empresas/:id" element={<Navigate to="/corretora/empresas/:id" replace />} />
              <Route path="/funcionarios-pendentes" element={<Navigate to="/corretora/funcionarios-pendentes" replace />} />
              <Route path="/ativar-funcionario" element={<Navigate to="/corretora/ativar-funcionario" replace />} />
              <Route path="/pendencias-exclusao" element={<Navigate to="/corretora/pendencias-exclusao" replace />} />
              <Route path="/planos/:id" element={<Navigate to="/corretora/planos/:id" replace />} />
              <Route path="/dados-planos" element={<Navigate to="/corretora/dados-planos" replace />} />
              <Route path="/auditoria" element={<Navigate to="/corretora/auditoria" replace />} />
              <Route path="/seguros-vida/empresas" element={<Navigate to="/corretora/seguros-vida/empresas" replace />} />
              <Route path="/seguros-vida/cnpjs" element={<Navigate to="/corretora/seguros-vida/cnpjs" replace />} />
              <Route path="/seguros-vida/planos/:id" element={<Navigate to="/corretora/seguros-vida/planos/:id" replace />} />
              <Route path="/relatorios/financeiro" element={<Navigate to="/corretora/relatorios/financeiro" replace />} />
              <Route path="/relatorios/funcionarios" element={<Navigate to="/corretora/relatorios/funcionarios" replace />} />
              <Route path="/relatorios/movimentacao" element={<Navigate to="/corretora/relatorios/movimentacao" replace />} />
              <Route path="/perfil" element={<Navigate to="/corretora/perfil" replace />} />
              <Route path="/configuracoes" element={<Navigate to="/corretora/configuracoes" replace />} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
