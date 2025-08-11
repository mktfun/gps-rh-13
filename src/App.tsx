import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/hooks/useAuth';

// Import existing pages
import Index from '@/pages/Index';
import Login from '@/pages/auth/Login';
import LandingPage from '@/pages/LandingPage';
import NotFound from '@/pages/NotFound';

// Import layout components
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedCorretoraRoute from '@/components/ProtectedCorretoraRoute';

// Import admin pages
import AdminDashboard from '@/pages/admin/Dashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';

// Import corretora pages
import CorretoraDashboard from '@/pages/corretora/Dashboard';
import EnhancedDashboard from '@/pages/corretora/EnhancedDashboard';
import EmpresasPage from '@/pages/corretora/Empresas';
import EmpresaDetalhes from '@/pages/corretora/EmpresaDetalhes';
import FuncionariosPendentes from '@/pages/corretora/FuncionariosPendentes';
import PendenciasExclusao from '@/pages/corretora/PendenciasExclusao';
import AtivarFuncionario from '@/pages/corretora/AtivarFuncionario';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';

// Import corretora relatórios
import RelatorioFinanceiroPage from '@/pages/corretora/relatorios/RelatorioFinanceiroPage';
import RelatorioFuncionariosCorretora from '@/pages/corretora/relatorios/RelatorioFuncionariosPage';
import RelatorioMovimentacaoPage from '@/pages/corretora/relatorios/RelatorioMovimentacaoPage';

// Import seguros-vida pages
import SegurosVidaEmpresasPage from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosVidaCnpjsPage from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import SegurosVidaPlanoPage from '@/pages/corretora/seguros-vida/SegurosVidaPlanoPage';

// Import empresa pages
import EmpresaDashboard from '@/pages/empresa/Dashboard';
import EmpresaFuncionarios from '@/pages/empresa/Funcionarios';
import EmpresaPlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';

// Import empresa relatórios
import RelatorioFuncionariosEmpresaPage from '@/pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage';
import RelatorioCustosEmpresaPage from '@/pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import RelatorioCustosDetalhadoPage from '@/pages/empresa/relatorios/RelatorioCustosDetalhadoPage';
import RelatorioFuncionariosEmpresa from '@/pages/empresa/relatorios/RelatorioFuncionariosPage';
import RelatorioPendenciasEmpresaPage from '@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';

// Import shared pages
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import PerfilPage from '@/pages/PerfilPage';
import ChatPage from '@/pages/ChatPage';

// Import the internal RootLayout (not the one from layouts folder)
import InternalRootLayout from '@/components/layout/RootLayout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Safety redirects for base paths */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/corretora" element={<Navigate to="/corretora/dashboard" replace />} />
            <Route path="/empresa" element={<Navigate to="/empresa/dashboard" replace />} />

            {/* Protected routes with layout */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <InternalRootLayout>
                  <Index />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Chat route */}
            <Route path="/chat" element={
              <ProtectedRoute>
                <InternalRootLayout>
                  <ChatPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Configurações route */}
            <Route path="/configuracoes" element={
              <ProtectedRoute>
                <InternalRootLayout>
                  <ConfiguracoesPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Perfil route */}
            <Route path="/perfil" element={
              <ProtectedRoute>
                <InternalRootLayout>
                  <PerfilPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <InternalRootLayout>
                  <AdminDashboard />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/corretoras" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <InternalRootLayout>
                  <CorretoraspPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Corretora routes */}
            <Route path="/corretora/dashboard" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <CorretoraDashboard />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/enhanced-dashboard" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <EnhancedDashboard />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/empresas" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <EmpresasPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/empresas/:empresaId" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <EmpresaDetalhes />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/funcionarios-pendentes" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <FuncionariosPendentes />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/pendencias-exclusao" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <PendenciasExclusao />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/ativar-funcionario/:funcionarioId" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <AtivarFuncionario />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/auditoria" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <AuditoriaPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            
            {/* Relatórios Corretora */}
            <Route path="/corretora/relatorios/financeiro" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <RelatorioFinanceiroPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/relatorios/funcionarios" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <RelatorioFuncionariosCorretora />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/relatorios/movimentacao" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <RelatorioMovimentacaoPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            
            {/* Seguros de Vida */}
            <Route path="/corretora/seguros-de-vida/empresas" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <SegurosVidaEmpresasPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/seguros-de-vida/empresa/:empresaId/cnpjs" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <SegurosVidaCnpjsPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />
            <Route path="/corretora/seguros-de-vida/empresa/:empresaId/cnpj/:cnpjId" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <SegurosVidaPlanoPage />
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />

            {/* Empresa routes */}
            <Route path="/empresa/dashboard" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <EmpresaDashboard />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/funcionarios" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <EmpresaFuncionarios />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/planos" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <EmpresaPlanosPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/planos/:planoId" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <PlanoDetalhesPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            
            {/* Relatórios Empresa */}
            <Route path="/empresa/relatorios/funcionarios-empresa" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <RelatorioFuncionariosEmpresaPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/relatorios/custos-empresa" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <RelatorioCustosEmpresaPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/relatorios/custos-detalhado" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <RelatorioCustosDetalhadoPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/relatorios/funcionarios" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <RelatorioFuncionariosEmpresa />
                </InternalRootLayout>
              </ProtectedRoute>
            } />
            <Route path="/empresa/relatorios/pendencias" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <RelatorioPendenciasEmpresaPage />
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
