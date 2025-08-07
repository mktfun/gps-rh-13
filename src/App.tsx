import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/admin/Dashboard';
import CorretoraspPage from './pages/admin/CorretorasPage';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProtectedCorretoraRoute from './components/auth/ProtectedCorretoraRoute';
import EmpresaDashboard from './pages/empresa/EmpresaDashboard';
import EmpresaFuncionarios from './pages/empresa/EmpresaFuncionarios';
import EmpresaPlanosPage from './pages/empresa/EmpresaPlanosPage';
import PlanoDetalhesPage from './pages/empresa/PlanoDetalhesPage';
import RelatorioFuncionariosPage from './pages/empresa/relatorios/RelatorioFuncionariosPage';
import RelatorioFuncionariosEmpresaPage from './pages/empresa/relatorios/RelatorioFuncionariosEmpresaPage';
import RelatorioCustosEmpresaPage from './pages/empresa/relatorios/RelatorioCustosEmpresaPage';
import RelatorioPendenciasEmpresaPage from './pages/empresa/relatorios/RelatorioPendenciasEmpresaPage';
import PerfilPage from './pages/PerfilPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import ChatPage from './pages/ChatPage';
import NotFound from './pages/NotFound';
import CorretoraDashboard from './pages/corretora/CorretoraDashboard';
import CorretoraEmpresas from './pages/corretora/CorretoraEmpresas';
import CorretoraFuncionarios from './pages/corretora/CorretoraFuncionarios';
import RelatorioCustosDetalhadoPage from "@/pages/empresa/relatorios/RelatorioCustosDetalhadoPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="corretoras" element={<CorretoraspPage />} />
        </Route>

        {/* Corretora routes */}
        <Route path="/corretora" element={
          <ProtectedCorretoraRoute>
            <RootLayout />
          </ProtectedCorretoraRoute>
        }>
          <Route index element={<CorretoraDashboard />} />
          <Route path="empresas" element={<CorretoraEmpresas />} />
          <Route path="funcionarios" element={<CorretoraFuncionarios />} />
        </Route>

        {/* Empresa routes */}
        <Route path="/empresa" element={
          <ProtectedRoute allowedRoles={['empresa']}>
            <RootLayout />
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
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<PerfilPage />} />
        </Route>

        <Route path="/configuracoes" element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ConfiguracoesPage />} />
        </Route>

        <Route path="/chat" element={
          <ProtectedRoute>
            <RootLayout />
          </ProtectedRoute>
        }>
          <Route index element={<ChatPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
