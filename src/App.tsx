import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedCorretoraRoute from "@/components/ProtectedCorretoraRoute";
import RootLayout from "@/components/layout/RootLayout";
import PublicLayout from "@/components/layout/PublicLayout";

// Auth pages
import Login from "./pages/auth/Login";

// Public pages
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import CorretoraspPage from "./pages/admin/CorretoraspPage";

// Corretora pages
import CorretoraDashboard from "./pages/corretora/Dashboard";
import Empresas from "./pages/corretora/Empresas";
import EmpresaDetalhes from "./pages/corretora/EmpresaDetalhes";
import AuditoriaPage from "./pages/corretora/AuditoriaPage";
import AtivarFuncionario from "./pages/corretora/AtivarFuncionario";

// Corretora - Seguros de Vida
import SegurosVidaEmpresasPage from "./pages/corretora/seguros-vida/SegurosVidaEmpresasPage";
import SegurosVidaCnpjsPage from "./pages/corretora/seguros-vida/SegurosVidaCnpjsPage";
import SegurosVidaPlanoPage from "./pages/corretora/seguros-vida/SegurosVidaPlanoPage";

// Corretora - Planos de Saúde
import PlanosSaudeEmpresasPage from "./pages/corretora/planos-saude/PlanosSaudeEmpresasPage";
import PlanosSaudeCnpjsPage from "./pages/corretora/planos-saude/PlanosSaudeCnpjsPage";
import PlanosSaudePlanoPage from "./pages/corretora/planos-saude/PlanosSaudePlanoPage";

// Corretora - Relatórios
import RelatorioFinanceiroPage from "./pages/corretora/relatorios/RelatorioFinanceiroPage";
import RelatorioFuncionariosPage from "./pages/corretora/relatorios/RelatorioFuncionariosPage";
import RelatorioMovimentacaoPage from "./pages/corretora/relatorios/RelatorioMovimentacaoPage";
import RelatorioPendenciasCorretoraPage from "./pages/corretora/relatorios/RelatorioPendenciasCorretoraPage";

// Empresa pages
import EmpresaDashboard from "./pages/empresa/Dashboard";
import EmpresaFuncionarios from "./pages/empresa/Funcionarios";
import EmpresaPlanosPage from "./pages/empresa/EmpresaPlanosPage";
import EmpresaPlanosSaudePage from "./pages/empresa/EmpresaPlanosSaudePage";
import PlanoDetalhesPage from "./pages/empresa/PlanoDetalhesPage";
import PlanoSaudeDetalhesPage from "./pages/empresa/PlanoSaudeDetalhesPage";
import SeguroVidaDetalhesPage from "./pages/empresa/SeguroVidaDetalhesPage";

// Empresa - Relatórios
import RelatorioFuncionariosEmpresaPage from "./pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage";
import RelatorioFuncionariosPageEmpresa from "./pages/empresa/relatorios/RelatorioFuncionariosPage";
import RelatorioCustosEmpresaPage from "./pages/empresa/relatorios/RelatorioCustosEmpresaPage";
import RelatorioCustosDetalhadoPage from "./pages/empresa/relatorios/RelatorioCustosDetalhadoPage";
import RelatorioPendenciasEmpresaPage from "./pages/empresa/relatorios/RelatorioPendenciasEmpresaPage";

// Shared pages
import PerfilPage from "./pages/PerfilPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import NotFound from "./pages/NotFound";
import EmBrevePage from "./pages/EmBrevePage";

const queryClient = new QueryClient();

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<Login />} />
        </Route>

        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
          {/* Admin routes */}
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/corretoras" element={<CorretoraspPage />} />

          {/* Corretora routes */}
          <Route path="corretora" element={<ProtectedCorretoraRoute />}>
            <Route path="dashboard" element={<CorretoraDashboard />} />
            <Route index element={<CorretoraDashboard />} />
            <Route path="empresas" element={<Empresas />} />
            <Route path="empresas/:empresaId" element={<EmpresaDetalhes />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="ativar-funcionario/:id" element={<AtivarFuncionario />} />
            
            {/* Seguros de Vida - rotas principais */}
            <Route path="seguros-de-vida/empresas" element={<SegurosVidaEmpresasPage />} />
            <Route path="seguros-de-vida/empresas/:empresaId/cnpjs" element={<SegurosVidaCnpjsPage />} />
            <Route path="seguros-de-vida/plano/:planoId" element={<SegurosVidaPlanoPage />} />
            
            {/* Seguros de Vida - rotas alias para compatibilidade */}
            <Route path="seguros-de-vida/:empresaId" element={<SegurosVidaCnpjsPage />} />
            <Route path="seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
            
            {/* Planos de Saúde - LIBERADAS */}
            <Route path="planos-de-saude/empresas" element={<PlanosSaudeEmpresasPage />} />
            <Route path="planos-de-saude/:empresaId" element={<PlanosSaudeCnpjsPage />} />
            <Route path="planos-de-saude/:empresaId/cnpj/:cnpjId" element={<PlanosSaudePlanoPage />} />
            
            {/* Relatórios */}
            <Route path="relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
            <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
            <Route path="relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
            <Route path="relatorios/pendencias" element={<RelatorioPendenciasCorretoraPage />} />
          </Route>

          {/* Empresa routes */}
          <Route path="empresa/dashboard" element={<EmpresaDashboard />} />
          <Route path="empresa/funcionarios" element={<EmpresaFuncionarios />} />
          <Route path="empresa/seguros-de-vida" element={<EmpresaPlanosPage />} />
          <Route path="empresa/planos-de-saude" element={<EmpresaPlanosSaudePage />} />
          <Route path="empresa/planos/:id" element={<PlanoDetalhesPage />} />
          <Route path="empresa/planos-saude/:id" element={<PlanoSaudeDetalhesPage />} />
          <Route path="empresa/planos-de-saude/:id" element={<PlanoSaudeDetalhesPage />} />
          
          {/* Rota corrigida para seguro de vida da empresa */}
          <Route path="empresa/seguros-de-vida/:planoId" element={<SeguroVidaDetalhesPage />} />
          {/* Alias para compatibilidade com links antigos */}
          <Route path="empresa/seguros-vida/:planoId" element={<SeguroVidaDetalhesPage />} />
          
          {/* Empresa - Relatórios */}
          <Route path="empresa/relatorios/funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
          <Route path="empresa/relatorios/funcionarios-detalhado" element={<RelatorioFuncionariosPageEmpresa />} />
          <Route path="empresa/relatorios/custos-empresa" element={<RelatorioCustosEmpresaPage />} />
          <Route path="empresa/relatorios/custos-detalhado" element={<RelatorioCustosDetalhadoPage />} />
          <Route path="empresa/relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />

          {/* Shared routes */}
          <Route path="perfil" element={<PerfilPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
