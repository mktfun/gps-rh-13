
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';

// Layouts e Proteção
import RootLayout from '@/components/layout/RootLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedCorretoraRoute from '@/components/ProtectedCorretoraRoute';

// Páginas Públicas e de Autenticação
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/auth/Login';
import NotFound from '@/pages/NotFound';

// Páginas de Admin
import AdminDashboard from '@/pages/admin/Dashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';

// Páginas da Corretora
import CorretoraDashboard from '@/pages/corretora/Dashboard';
import Empresas from '@/pages/corretora/Empresas';
import EmpresaDetalhes from '@/pages/corretora/EmpresaDetalhes';
import FuncionariosPendentes from '@/pages/corretora/FuncionariosPendentes';
import PendenciasExclusao from '@/pages/corretora/PendenciasExclusao';
import AtivarFuncionario from '@/pages/corretora/AtivarFuncionario';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';

// Páginas de Planos da Corretora
import SegurosVidaEmpresasPage from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosVidaCnpjsPage from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import SegurosVidaPlanoPage from '@/pages/corretora/seguros-vida/SegurosVidaPlanoPage';
import PlanosSaudeEmpresasPage from '@/pages/corretora/planos-saude/PlanosSaudeEmpresasPage';
import PlanosSaudeCnpjsPage from '@/pages/corretora/planos-saude/PlanosSaudeCnpjsPage';
import PlanosSaudePlanoPage from '@/pages/corretora/planos-saude/PlanosSaudePlanoPage';

// Páginas de Relatórios da Corretora
import RelatorioFinanceiroPage from '@/pages/corretora/relatorios/RelatorioFinanceiroPage';
import RelatorioFuncionariosPage from '@/pages/corretora/relatorios/RelatorioFuncionariosPage';
import RelatorioMovimentacaoPage from '@/pages/corretora/relatorios/RelatorioMovimentacaoPage';

// Páginas da Empresa
import EmpresaDashboard from '@/pages/empresa/Dashboard';
import EmpresaFuncionarios from '@/pages/empresa/Funcionarios';
import EmpresaPlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import EmpresaPlanosSaudePage from '@/pages/empresa/EmpresaPlanosSaudePage';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';

// Relatórios da Empresa
import RelatorioCustosEmpresaPage from '@/pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import RelatorioCustosDetalhadoPage from '@/pages/empresa/relatorios/RelatorioCustosDetalhadoPage';
import RelatorioFuncionariosEmpresaPage from '@/pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage';
import RelatorioPendenciasEmpresaPage from '@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';

// Páginas Compartilhadas
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import ChatPage from '@/pages/ChatPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* === ROTAS PÚBLICAS === */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* === CONTAINER PARA TODAS AS ROTAS PROTEGIDAS (COM LAYOUT) === */}
            <Route element={<RootLayout />}>
              
              {/* Protetor para rotas que exigem QUALQUER usuário logado */}
              <Route element={<ProtectedRoute />}>
                
                {/* --- ROTAS DA EMPRESA --- */}
                <Route path="/empresa/dashboard" element={<EmpresaDashboard />} />
                <Route path="/empresa/funcionarios" element={<EmpresaFuncionarios />} />
                <Route path="/empresa/planos" element={<EmpresaPlanosPage />} />
                <Route path="/empresa/planos-saude" element={<EmpresaPlanosSaudePage />} />
                <Route path="/empresa/planos/:id" element={<PlanoDetalhesPage />} />
                
                {/* Relatórios - Empresa */}
                <Route path="/empresa/relatorios/custos" element={<RelatorioCustosEmpresaPage />} />
                <Route path="/empresa/relatorios/custos/detalhado" element={<RelatorioCustosDetalhadoPage />} />
                <Route path="/empresa/relatorios/funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
                <Route path="/empresa/relatorios/funcionarios/geral" element={<RelatorioFuncionariosPage />} />
                <Route path="/empresa/relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />
                
                {/* --- ROTAS COMPARTILHADAS (acessíveis por empresa e corretora) --- */}
                <Route path="/perfil" element={<PerfilPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                <Route path="/chat" element={<ChatPage />} />

                {/* --- ROTAS DA CORRETORA (exigem role 'corretora') --- */}
                <Route element={<ProtectedCorretoraRoute />}>
                  <Route path="/corretora/dashboard" element={<CorretoraDashboard />} />
                  <Route path="/corretora/empresas" element={<Empresas />} />
                  <Route path="/corretora/empresas/:empresaId" element={<EmpresaDetalhes />} />
                  
                  <Route path="/corretora/funcionarios-pendentes" element={<FuncionariosPendentes />} />
                  <Route path="/corretora/pendencias-exclusao" element={<PendenciasExclusao />} />
                  <Route path="/corretora/ativar-funcionario" element={<AtivarFuncionario />} />
                  <Route path="/corretora/auditoria" element={<AuditoriaPage />} />

                  {/* Planos de Vida */}
                  <Route path="/corretora/seguros-de-vida/empresas" element={<SegurosVidaEmpresasPage />} />
                  <Route path="/corretora/seguros-de-vida/:empresaId" element={<SegurosVidaCnpjsPage />} />
                  <Route path="/corretora/seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />

                  {/* Planos de Saúde */}
                  <Route path="/corretora/planos-de-saude/empresas" element={<PlanosSaudeEmpresasPage />} />
                  <Route path="/corretora/planos-de-saude/:empresaId" element={<PlanosSaudeCnpjsPage />} />
                  <Route path="/corretora/planos-de-saude/:empresaId/cnpj/:cnpjId" element={<PlanosSaudePlanoPage />} />

                  {/* Relatórios */}
                  <Route path="/corretora/relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
                  <Route path="/corretora/relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
                  <Route path="/corretora/relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
                </Route>

                {/* --- ROTAS DE ADMIN --- */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/corretoras" element={<CorretoraspPage />} />

              </Route>
            </Route>

            {/* ROTA 404 - PEGA TUDO O QUE NÃO DEU MATCH */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
