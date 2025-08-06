import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

// Public Pages
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

// Layouts
import PublicLayout from '@/layouts/PublicLayout';
import RootLayout from '@/layouts/RootLayout';

// Protected Route
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Dashboard Pages
import Index from '@/pages';
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import ChatPage from '@/pages/ChatPage';

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';

// Corretora Pages
import CorretoraDashboard from '@/pages/corretora/CorretoraDashboard';
import Empresas from '@/pages/corretora/Empresas';
import EmpresaDetalhes from '@/pages/corretora/EmpresaDetalhes';
import FuncionariosPendentes from '@/pages/corretora/FuncionariosPendentes';
import PendenciasExclusao from '@/pages/corretora/PendenciasExclusao';
import AtivarFuncionario from '@/pages/corretora/AtivarFuncionario';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';
import RelatorioFinanceiroPage from '@/pages/corretora/RelatorioFinanceiroPage';
import RelatorioFuncionariosPage from '@/pages/corretora/RelatorioFuncionariosPage';
import RelatorioMovimentacaoPage from '@/pages/corretora/RelatorioMovimentacaoPage';
import SegurosVidaEmpresasPage from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosVidaCnpjsPage from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import SegurosVidaPlanoPage from '@/pages/corretora/seguros-vida/SegurosVidaPlanoPage';

// Empresa Pages
import EmpresaDashboard from '@/pages/empresa/EmpresaDashboard';
import EmpresaFuncionarios from '@/pages/empresa/EmpresaFuncionarios';
import EmpresaPlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';
import RelatorioFuncionariosEmpresaPage from '@/pages/empresa/RelatorioFuncionariosEmpresaPage';
import RelatorioCustosEmpresaPage from '@/pages/empresa/RelatorioCustosEmpresaPage';
import RelatorioPendenciasEmpresaPage from '@/pages/empresa/RelatorioPendenciasEmpresaPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <RootLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard routes based on user role */}
            <Route path="dashboard" element={<Index />} />
            <Route path="perfil" element={<PerfilPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
            <Route path="chat" element={<ChatPage />} />

            {/* Admin Routes */}
            <Route path="admin">
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="corretoras" element={<CorretoraspPage />} />
            </Route>

            {/* Corretora Routes */}
            <Route path="corretora">
              <Route index element={<Navigate to="/corretora/dashboard" replace />} />
              <Route path="dashboard" element={<CorretoraDashboard />} />
              <Route path="empresas" element={<Empresas />} />
              <Route path="empresas/:id" element={<EmpresaDetalhes />} />
              <Route path="funcionarios-pendentes" element={<FuncionariosPendentes />} />
              <Route path="pendencias-exclusao" element={<PendenciasExclusao />} />
              <Route path="ativar-funcionario" element={<AtivarFuncionario />} />
              <Route path="auditoria" element={<AuditoriaPage />} />
              
              <Route path="relatorios">
                <Route path="financeiro" element={<RelatorioFinanceiroPage />} />
                <Route path="funcionarios" element={<RelatorioFuncionariosPage />} />
                <Route path="movimentacao" element={<RelatorioMovimentacaoPage />} />
              </Route>
              
              <Route path="seguros-de-vida">
                <Route path="empresas" element={<SegurosVidaEmpresasPage />} />
                <Route path="cnpjs" element={<SegurosVidaCnpjsPage />} />
                <Route path="plano/:planoId" element={<SegurosVidaPlanoPage />} />
              </Route>
            </Route>

            {/* Empresa Routes */}
            <Route path="empresa">
              <Route index element={<Navigate to="/empresa/dashboard" replace />} />
              <Route path="dashboard" element={<EmpresaDashboard />} />
              <Route path="funcionarios" element={<EmpresaFuncionarios />} />
              <Route path="planos" element={<EmpresaPlanosPage />} />
              <Route path="planos/:id" element={<PlanoDetalhesPage />} />
              
              <Route path="relatorios">
                <Route path="funcionarios" element={<RelatorioFuncionariosEmpresaPage />} />
                <Route path="custos" element={<RelatorioCustosEmpresaPage />} />
                <Route path="pendencias" element={<RelatorioPendenciasEmpresaPage />} />
              </Route>
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
