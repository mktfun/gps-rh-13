
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/auth/Login';
import Dashboard from '@/pages/admin/Dashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';
import RootLayout from '@/layouts/RootLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedCorretoraRoute from '@/components/ProtectedCorretoraRoute';
import EmpresaDashboard from '@/pages/empresa/Dashboard';
import EmpresaFuncionarios from '@/pages/empresa/Funcionarios';
import EmpresaPlanosPage from '@/pages/empresa/EmpresaPlanosPage';
import PlanoDetalhesPage from '@/pages/empresa/PlanoDetalhesPage';
import RelatorioFuncionariosPage from '@/pages/empresa/relatorios/RelatorioFuncionariosPage';
import RelatorioFuncionariosEmpresaPage from '@/pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage';
import RelatorioCustosEmpresaPage from '@/pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import RelatorioPendenciasEmpresaPage from '@/pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import ChatPage from '@/pages/ChatPage';
import NotFound from '@/pages/NotFound';
import CorretoraDashboard from '@/pages/corretora/Dashboard';
import CorretoraEmpresas from '@/pages/corretora/Empresas';
import EmpresaDetalhes from '@/pages/corretora/EmpresaDetalhes';
import FuncionariosPendentes from '@/pages/corretora/FuncionariosPendentes';
import RelatorioCustosDetalhadoPage from "@/pages/empresa/relatorios/RelatorioCustosDetalhadoPage";
import SegurosVidaEmpresasPage from '@/pages/corretora/seguros-vida/SegurosVidaEmpresasPage';
import SegurosVidaCnpjsPage from '@/pages/corretora/seguros-vida/SegurosVidaCnpjsPage';
import SegurosVidaPlanoPage from '@/pages/corretora/seguros-vida/SegurosVidaPlanoPage';
import RelatorioFinanceiroPage from '@/pages/corretora/relatorios/RelatorioFinanceiroPage';
import RelatorioFuncionariosPageCorretora from '@/pages/corretora/relatorios/RelatorioFuncionariosPage';
import RelatorioMovimentacaoPage from '@/pages/corretora/relatorios/RelatorioMovimentacaoPage';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';
import AppLayout from '@/components/layout/RootLayout';

function App() {
  return (
    <BrowserRouter>
      <RootLayout>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          {/* Admin routes */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="corretoras" element={<CorretoraspPage />} />
          </Route>

          {/* Corretora routes */}
          <Route path="/corretora" element={
            <ProtectedCorretoraRoute>
              <AppLayout />
            </ProtectedCorretoraRoute>
          }>
            <Route index element={<CorretoraDashboard />} />
            <Route path="empresas" element={<CorretoraEmpresas />} />
            <Route path="empresas/:id" element={<EmpresaDetalhes />} />
            <Route path="funcionarios" element={<FuncionariosPendentes />} />
            
            {/* Seguros de Vida nested routes */}
            <Route path="seguros-de-vida" element={<SegurosVidaEmpresasPage />} />
            <Route path="seguros-de-vida/:empresaId" element={<SegurosVidaCnpjsPage />} />
            <Route path="seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
            
            {/* Relatórios nested routes */}
            <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosPageCorretora />} />
            <Route path="relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
            <Route path="relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
            
            {/* Auditoria route */}
            <Route path="auditoria" element={<AuditoriaPage />} />
          </Route>

          {/* Empresa routes */}
          <Route path="/empresa" element={
            <ProtectedRoute allowedRoles={['empresa']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<EmpresaDashboard />} />
            <Route path="funcionarios" element={<EmpresaFuncionarios />} />
            <Route path="planos" element={<EmpresaPlanosPage />} />
            <Route path="planos/:planoId" element={<PlanoDetalhesPage />} />
            
            {/* Relatórios */}
            <Route path="relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
            <Route path="relatorios/funcionarios-detalhado" element={<RelatorioFuncionariosEmpresaPage />} />
            <Route path="relatorios/custos" element={<RelatorioCustosEmpresaPage />} />
            <Route path="relatorios/custos-detalhado" element={<RelatorioCustosDetalhadoPage />} />
            <Route path="relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />
          </Route>

          {/* Shared routes */}
          <Route path="/perfil" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<PerfilPage />} />
          </Route>

          <Route path="/configuracoes" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ConfiguracoesPage />} />
          </Route>

          <Route path="/chat" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<ChatPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

export default App;
