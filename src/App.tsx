
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";

// Public pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/auth/Login";

// Protected pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PerfilPage from "./pages/PerfilPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import EmBrevePage from "./pages/EmBrevePage";

// Admin pages
import Dashboard from "./pages/admin/Dashboard";
import CorretoraspPage from "./pages/admin/CorretoraspPage";

// Corretora pages
import CorretoraDashboard from "./pages/corretora/Dashboard";
import EnhancedDashboard from "./pages/corretora/EnhancedDashboard";
import Empresas from "./pages/corretora/Empresas";
import EmpresaDetalhes from "./pages/corretora/EmpresaDetalhes";
import FuncionariosPendentes from "./pages/corretora/FuncionariosPendentes";
import PendenciasExclusao from "./pages/corretora/PendenciasExclusao";
import AtivarFuncionario from "./pages/corretora/AtivarFuncionario";
import AuditoriaPage from "./pages/corretora/AuditoriaPage";

// Relatorios corretora
import RelatorioFinanceiroPage from "./pages/corretora/relatorios/RelatorioFinanceiroPage";
import RelatorioFuncionariosCorretoraPage from "./pages/corretora/relatorios/RelatorioFuncionariosPage";
import RelatorioMovimentacaoPage from "./pages/corretora/relatorios/RelatorioMovimentacaoPage";

// Seguros de vida corretora
import SegurosVidaEmpresasPage from "./pages/corretora/seguros-vida/SegurosVidaEmpresasPage";
import SegurosVidaCnpjsPage from "./pages/corretora/seguros-vida/SegurosVidaCnpjsPage";
import SegurosVidaPlanoPage from "./pages/corretora/seguros-vida/SegurosVidaPlanoPage";

// Planos de saúde corretora
import PlanosSaudeEmpresasPage from "./pages/corretora/planos-saude/PlanosSaudeEmpresasPage";
import PlanosSaudeCnpjsPage from "./pages/corretora/planos-saude/PlanosSaudeCnpjsPage";
import PlanosSaudePlanoPage from "./pages/corretora/planos-saude/PlanosSaudePlanoPage";

// Empresa pages
import EmpresaDashboard from "./pages/empresa/Dashboard";
import Funcionarios from "./pages/empresa/Funcionarios";
import EmpresaPlanosPage from "./pages/empresa/EmpresaPlanosPage";
import EmpresaPlanosSaudePage from "./pages/empresa/EmpresaPlanosSaudePage";
import PlanoDetalhesPage from "./pages/empresa/PlanoDetalhesPage";
import PlanoSaudeDetalhesPage from "./pages/empresa/PlanoSaudeDetalhesPage";
import SeguroVidaDetalhesPage from "./pages/empresa/SeguroVidaDetalhesPage";

// Relatorios empresa
import RelatorioFuncionariosEmpresaPage from "./pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage";
import RelatorioFuncionariosPage from "./pages/empresa/relatorios/RelatorioFuncionariosPage";
import RelatorioCustosEmpresaPage from "./pages/empresa/relatorios/RelatorioCustosEmpresaPage";
import RelatorioCustosDetalhadoPage from "./pages/empresa/relatorios/RelatorioCustosDetalhadoPage";
import RelatorioPendenciasEmpresaPage from "./pages/empresa/relatorios/RelatorioPendenciasEmpresaPage";

// Layout and protection - CORRIGIDO: importando o RootLayout completo
import RootLayout from "./components/layout/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedCorretoraRoute from "./components/ProtectedCorretoraRoute";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                
                {/* Protected Routes */}
                <Route path="/" element={<ProtectedRoute><RootLayout /></ProtectedRoute>}>
                  <Route index element={<Index />} />
                  <Route path="perfil" element={<PerfilPage />} />
                  <Route path="configuracoes" element={<ConfiguracoesPage />} />
                  <Route path="em-breve" element={<EmBrevePage />} />
                  
                  {/* Admin Routes */}
                  <Route path="admin/dashboard" element={<Dashboard />} />
                  <Route path="admin/corretoras" element={<CorretoraspPage />} />
                  
                  {/* Corretora Routes */}
                  <Route path="corretora/dashboard" element={<ProtectedCorretoraRoute><CorretoraDashboard /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/enhanced-dashboard" element={<ProtectedCorretoraRoute><EnhancedDashboard /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/empresas" element={<ProtectedCorretoraRoute><Empresas /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/empresa/:empresaId" element={<ProtectedCorretoraRoute><EmpresaDetalhes /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/funcionarios-pendentes" element={<ProtectedCorretoraRoute><FuncionariosPendentes /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/pendencias-exclusao" element={<ProtectedCorretoraRoute><PendenciasExclusao /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/ativar-funcionario" element={<ProtectedCorretoraRoute><AtivarFuncionario /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/auditoria" element={<ProtectedCorretoraRoute><AuditoriaPage /></ProtectedCorretoraRoute>} />
                  
                  {/* Corretora Relatórios */}
                  <Route path="corretora/relatorios/financeiro" element={<ProtectedCorretoraRoute><RelatorioFinanceiroPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/relatorios/funcionarios" element={<ProtectedCorretoraRoute><RelatorioFuncionariosCorretoraPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/relatorios/movimentacao" element={<ProtectedCorretoraRoute><RelatorioMovimentacaoPage /></ProtectedCorretoraRoute>} />
                  
                  {/* Corretora Seguros de Vida */}
                  <Route path="corretora/seguros-de-vida/empresas" element={<ProtectedCorretoraRoute><SegurosVidaEmpresasPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/seguros-de-vida/empresa/:empresaId/cnpjs" element={<ProtectedCorretoraRoute><SegurosVidaCnpjsPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/seguros-de-vida/empresa/:empresaId/cnpj/:cnpjId" element={<ProtectedCorretoraRoute><SegurosVidaPlanoPage /></ProtectedCorretoraRoute>} />
                  
                  {/* Corretora Planos de Saúde */}
                  <Route path="corretora/planos-de-saude/empresas" element={<ProtectedCorretoraRoute><PlanosSaudeEmpresasPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/planos-de-saude/empresa/:empresaId/cnpjs" element={<ProtectedCorretoraRoute><PlanosSaudeCnpjsPage /></ProtectedCorretoraRoute>} />
                  <Route path="corretora/planos-de-saude/empresa/:empresaId/cnpj/:cnpjId" element={<ProtectedCorretoraRoute><PlanosSaudePlanoPage /></ProtectedCorretoraRoute>} />
                  
                  {/* Empresa Routes */}
                  <Route path="empresa/dashboard" element={<EmpresaDashboard />} />
                  <Route path="empresa/funcionarios" element={<Funcionarios />} />
                  <Route path="empresa/planos" element={<EmpresaPlanosPage />} />
                  <Route path="empresa/planos-saude" element={<EmpresaPlanosSaudePage />} />
                  <Route path="empresa/plano/:planoId" element={<PlanoDetalhesPage />} />
                  <Route path="empresa/plano-saude/:planoId" element={<PlanoSaudeDetalhesPage />} />
                  <Route path="empresa/seguro-vida/:planoId" element={<SeguroVidaDetalhesPage />} />
                  
                  {/* Empresa Relatórios */}
                  <Route path="empresa/relatorios/funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
                  <Route path="empresa/relatorios/funcionarios-completo" element={<RelatorioFuncionariosPage />} />
                  <Route path="empresa/relatorios/custos" element={<RelatorioCustosEmpresaPage />} />
                  <Route path="empresa/relatorios/custos-detalhado" element={<RelatorioCustosDetalhadoPage />} />
                  <Route path="empresa/relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />
                </Route>
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
