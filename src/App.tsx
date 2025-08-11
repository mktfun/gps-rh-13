import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from '@/pages/Index';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/auth/Login';
import AdminDashboard from '@/pages/admin/Dashboard';
import CorretoraDashboard from '@/pages/corretora/Dashboard';
import EmpresaDashboard from '@/pages/empresa/Dashboard';
import Empresas from '@/pages/corretora/Empresas';
import EmpresaDetalhes from '@/pages/corretora/EmpresaDetalhes';
import EmpresaFuncionarios from '@/pages/empresa/Funcionarios';
import EmpresaPlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import EmpresaPlanosSaudePage from '@/pages/empresa/EmpresaPlanosSaudePage';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';
import FuncionariosPendentes from '@/pages/corretora/FuncionariosPendentes';
import PendenciasExclusao from '@/pages/corretora/PendenciasExclusao';
import AtivarFuncionario from '@/pages/corretora/AtivarFuncionario';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import ChatPage from '@/pages/ChatPage';
import NotFound from '@/pages/NotFound';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';

// Seguros de Vida - Corretora
import SegurosVidaEmpresasPage from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosVidaCnpjsPage from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import SegurosVidaPlanoPage from '@/pages/corretora/seguros-vida/SegurosVidaPlanoPage';

// Planos de Saúde - Corretora
import PlanosSaudeEmpresasPage from '@/pages/corretora/planos-saude/PlanosSaudeEmpresasPage';
import PlanosSaudeCnpjsPage from '@/pages/corretora/planos-saude/PlanosSaudeCnpjsPage';
import PlanosSaudePlanoPage from '@/pages/corretora/planos-saude/PlanosSaudePlanoPage';

// Relatórios
import RelatorioFinanceiroPage from '@/pages/corretora/relatorios/RelatorioFinanceiroPage';
import RelatorioFuncionariosPage from '@/pages/corretora/relatorios/RelatorioFuncionariosPage';
import RelatorioMovimentacaoPage from '@/pages/corretora/relatorios/RelatorioMovimentacaoPage';
import RelatorioCustosEmpresaPage from '@/pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import RelatorioCustosDetalhadoPage from '@/pages/empresa/relatorios/RelatorioCustosDetalhadoPage';
import RelatorioFuncionariosEmpresaPage from '@/pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage';
import RelatorioPendenciasEmpresaPage from '@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';

import { RootLayout } from '@/layouts/RootLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ProtectedCorretoraRoute } from '@/components/ProtectedCorretoraRoute';

function App() {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <Toaster />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<RootLayout />}>
              
              {/* Admin routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/corretoras" element={<CorretoraspPage />} />

              {/* Corretora routes */}
              <Route element={<ProtectedCorretoraRoute />}>
                <Route path="/corretora/dashboard" element={<CorretoraDashboard />} />
                <Route path="/corretora/empresas" element={<Empresas />} />
                <Route path="/corretora/empresa/:id" element={<EmpresaDetalhes />} />
                <Route path="/corretora/funcionarios-pendentes" element={<FuncionariosPendentes />} />
                <Route path="/corretora/pendencias-exclusao" element={<PendenciasExclusao />} />
                <Route path="/corretora/ativar-funcionario" element={<AtivarFuncionario />} />
                <Route path="/corretora/auditoria" element={<AuditoriaPage />} />
                
                {/* Seguros de Vida - Corretora */}
                <Route path="/corretora/seguros-de-vida/empresas" element={<SegurosVidaEmpresasPage />} />
                <Route path="/corretora/seguros-de-vida/:empresaId" element={<SegurosVidaCnpjsPage />} />
                <Route path="/corretora/seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
                
                {/* Planos de Saúde - Corretora */}
                <Route path="/corretora/planos-de-saude/empresas" element={<PlanosSaudeEmpresasPage />} />
                <Route path="/corretora/planos-de-saude/:empresaId" element={<PlanosSaudeCnpjsPage />} />
                <Route path="/corretora/planos-de-saude/:empresaId/cnpj/:cnpjId" element={<PlanosSaudePlanoPage />} />
                
                {/* Relatórios - Corretora */}
                <Route path="/corretora/relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
                <Route path="/corretora/relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
                <Route path="/corretora/relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
              </Route>

              {/* Empresa routes */}
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

              {/* Shared routes */}
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>

          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
