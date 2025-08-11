
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/hooks/useAuth';

import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/admin/Dashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedCorretoraRoute from '@/components/ProtectedCorretoraRoute';
import RootLayout from '@/components/layout/RootLayout';
import ChatPage from '@/pages/ChatPage';
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import NotFound from '@/pages/NotFound';
import CorretoraDashboard from '@/pages/corretora/Dashboard';
import EmpresasPage from '@/pages/corretora/Empresas';
import FuncionariosPendentesPage from '@/pages/corretora/FuncionariosPendentes';
import PendenciasExclusaoPage from '@/pages/corretora/PendenciasExclusao';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';
import EmpresaDashboard from '@/pages/empresa/Dashboard';
import FuncionariosPage from '@/pages/empresa/Funcionarios';
import PlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import AtivarFuncionarioPage from '@/pages/corretora/AtivarFuncionario';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';
import RelatorioFuncionarios from '@/pages/empresa/relatorios/RelatorioFuncionariosPage';
import CustosEmpresa from '@/pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import Pendencias from '@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';
import EnhancedDashboard from '@/pages/corretora/EnhancedDashboard';
import SegurosDeVidaEmpresas from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosDeVidaCnpj from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import RelatorioFinanceiro from '@/pages/corretora/relatorios/RelatorioFinanceiroPage';
import RelatorioFuncionariosCorretora from '@/pages/corretora/relatorios/RelatorioFuncionariosPage';
import RelatorioMovimentacao from '@/pages/corretora/relatorios/RelatorioMovimentacaoPage';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Toaster />
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />

            {/* Safety redirects for base paths */}
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/corretora" element={<Navigate to="/corretora/dashboard" replace />} />
            <Route path="/empresa" element={<Navigate to="/empresa/dashboard" replace />} />
            
            {/* Additional redirects for planos */}
            <Route path="/empresa/planos-saude" element={<Navigate to="/empresa/planos-saude" replace />} />

            {/* Protected admin routes */}
            <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="dashboard" element={<RootLayout><Dashboard /></RootLayout>} />
              <Route path="corretoras" element={<RootLayout><CorretoraspPage /></RootLayout>} />
            </Route>

            {/* Protected corretora routes */}
            <Route path="/corretora/*" element={<ProtectedCorretoraRoute />}>
              <Route path="dashboard" element={<RootLayout><CorretoraDashboard /></RootLayout>} />
              <Route path="enhanced-dashboard" element={<RootLayout><EnhancedDashboard /></RootLayout>} />
              <Route path="empresas" element={<RootLayout><EmpresasPage /></RootLayout>} />
              <Route path="funcionarios-pendentes" element={<RootLayout><FuncionariosPendentesPage /></RootLayout>} />
              <Route path="pendencias-exclusao" element={<RootLayout><PendenciasExclusaoPage /></RootLayout>} />
              <Route path="auditoria" element={<RootLayout><AuditoriaPage /></RootLayout>} />
              <Route path="ativar-funcionario/:funcionarioId" element={<RootLayout><AtivarFuncionarioPage /></RootLayout>} />
              
              {/* Seguros de Vida Routes */}
              <Route path="seguros-de-vida/empresas" element={<RootLayout><SegurosDeVidaEmpresas /></RootLayout>} />
              <Route path="seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<RootLayout><SegurosDeVidaCnpj /></RootLayout>} />

              {/* Planos de Saúde Routes - NOVAS ROTAS */}
              <Route path="planos-de-saude/empresas" element={<RootLayout><div>PlanosSaudeEmpresasPage - Em breve</div></RootLayout>} />
              <Route path="planos-de-saude/:empresaId" element={<RootLayout><div>PlanosSaudeCnpjsPage - Em breve</div></RootLayout>} />
              <Route path="planos-de-saude/:empresaId/cnpj/:cnpjId" element={<RootLayout><div>PlanosSaudePlanoPage - Em breve</div></RootLayout>} />

              {/* Relatórios routes */}
              <Route path="relatorios/financeiro" element={<RootLayout><RelatorioFinanceiro /></RootLayout>} />
              <Route path="relatorios/funcionarios" element={<RootLayout><RelatorioFuncionariosCorretora /></RootLayout>} />
              <Route path="relatorios/movimentacao" element={<RootLayout><RelatorioMovimentacao /></RootLayout>} />
            </Route>

            {/* Protected empresa routes */}
            <Route path="/empresa/*" element={<ProtectedRoute allowedRoles={['empresa']} />}>
              <Route path="dashboard" element={<RootLayout><EmpresaDashboard /></RootLayout>} />
              <Route path="funcionarios" element={<RootLayout><FuncionariosPage /></RootLayout>} />
              <Route path="planos" element={<RootLayout><PlanosPage /></RootLayout>} />
              <Route path="plano/:planoId" element={<RootLayout><PlanoDetalhesPage /></RootLayout>} />

              {/* Planos de Saúde Route - NOVA ROTA */}
              <Route path="planos-saude" element={<RootLayout><div>EmpresaPlanosSaudePage - Em breve</div></RootLayout>} />

              {/* Relatórios routes */}
              <Route path="relatorios/funcionarios" element={<RootLayout><RelatorioFuncionarios /></RootLayout>} />
              <Route path="relatorios/custos-empresa" element={<RootLayout><CustosEmpresa /></RootLayout>} />
              <Route path="relatorios/pendencias" element={<RootLayout><Pendencias /></RootLayout>} />
            </Route>

            {/* Shared protected routes */}
            <Route path="/chat" element={<ProtectedRoute><RootLayout><ChatPage /></RootLayout></ProtectedRoute>} />
            <Route path="/perfil" element={<ProtectedRoute><RootLayout><PerfilPage /></RootLayout></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><RootLayout><ConfiguracoesPage /></RootLayout></ProtectedRoute>} />

            {/* 404 handler */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
