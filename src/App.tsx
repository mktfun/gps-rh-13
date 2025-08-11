
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <InternalRootLayout>
                  <Routes>
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="corretoras" element={<CorretoraspPage />} />
                  </Routes>
                </InternalRootLayout>
              </ProtectedRoute>
            } />

            {/* Corretora routes */}
            <Route path="/corretora/*" element={
              <ProtectedCorretoraRoute>
                <InternalRootLayout>
                  <Routes>
                    <Route path="dashboard" element={<CorretoraDashboard />} />
                    <Route path="enhanced-dashboard" element={<EnhancedDashboard />} />
                    <Route path="empresas" element={<EmpresasPage />} />
                    <Route path="empresas/:empresaId" element={<EmpresaDetalhes />} />
                    <Route path="funcionarios-pendentes" element={<FuncionariosPendentes />} />
                    <Route path="pendencias-exclusao" element={<PendenciasExclusao />} />
                    <Route path="ativar-funcionario/:funcionarioId" element={<AtivarFuncionario />} />
                    <Route path="auditoria" element={<AuditoriaPage />} />
                    
                    {/* Relatórios */}
                    <Route path="relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
                    <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosCorretora />} />
                    <Route path="relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
                    
                    {/* Seguros de Vida */}
                    <Route path="seguros-de-vida/empresas" element={<SegurosVidaEmpresasPage />} />
                    <Route path="seguros-de-vida/empresa/:empresaId/cnpjs" element={<SegurosVidaCnpjsPage />} />
                    <Route path="seguros-de-vida/empresa/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
                  </Routes>
                </InternalRootLayout>
              </ProtectedCorretoraRoute>
            } />

            {/* Empresa routes */}
            <Route path="/empresa/*" element={
              <ProtectedRoute allowedRoles={['empresa']}>
                <InternalRootLayout>
                  <Routes>
                    <Route path="dashboard" element={<EmpresaDashboard />} />
                    <Route path="funcionarios" element={<EmpresaFuncionarios />} />
                    <Route path="planos" element={<EmpresaPlanosPage />} />
                    <Route path="planos/:planoId" element={<PlanoDetalhesPage />} />
                    
                    {/* Relatórios */}
                    <Route path="relatorios/funcionarios-empresa" element={<RelatorioFuncionariosEmpresaPage />} />
                    <Route path="relatorios/custos-empresa" element={<RelatorioCustosEmpresaPage />} />
                    <Route path="relatorios/custos-detalhado" element={<RelatorioCustosDetalhadoPage />} />
                    <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosEmpresa />} />
                    <Route path="relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />
                  </Routes>
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
