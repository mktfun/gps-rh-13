
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
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/corretoras" element={<CorretoraspPage />} />
            </Route>
          </Route>

          {/* Corretora routes */}
          <Route element={<ProtectedCorretoraRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/corretora" element={<CorretoraDashboard />} />
              <Route path="/corretora/empresas" element={<CorretoraEmpresas />} />
              <Route path="/corretora/empresas/:id" element={<EmpresaDetalhes />} />
              <Route path="/corretora/funcionarios" element={<FuncionariosPendentes />} />
              
              {/* Seguros de Vida nested routes */}
              <Route path="/corretora/seguros-de-vida" element={<SegurosVidaEmpresasPage />} />
              <Route path="/corretora/seguros-de-vida/:empresaId" element={<SegurosVidaCnpjsPage />} />
              <Route path="/corretora/seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<SegurosVidaPlanoPage />} />
              
              {/* Relatórios nested routes */}
              <Route path="/corretora/relatorios/funcionarios" element={<RelatorioFuncionariosPageCorretora />} />
              <Route path="/corretora/relatorios/financeiro" element={<RelatorioFinanceiroPage />} />
              <Route path="/corretora/relatorios/movimentacao" element={<RelatorioMovimentacaoPage />} />
              
              {/* Auditoria route */}
              <Route path="/corretora/auditoria" element={<AuditoriaPage />} />
            </Route>
          </Route>

          {/* Empresa routes */}
          <Route element={<ProtectedRoute allowedRoles={['empresa']} />}>
            <Route element={<AppLayout />}>
              <Route path="/empresa" element={<EmpresaDashboard />} />
              <Route path="/empresa/funcionarios" element={<EmpresaFuncionarios />} />
              <Route path="/empresa/planos" element={<EmpresaPlanosPage />} />
              <Route path="/empresa/planos/:planoId" element={<PlanoDetalhesPage />} />
              
              {/* Relatórios */}
              <Route path="/empresa/relatorios/funcionarios" element={<RelatorioFuncionariosPage />} />
              <Route path="/empresa/relatorios/funcionarios-detalhado" element={<RelatorioFuncionariosEmpresaPage />} />
              <Route path="/empresa/relatorios/custos" element={<RelatorioCustosEmpresaPage />} />
              <Route path="/empresa/relatorios/custos-detalhado" element={<RelatorioCustosDetalhadoPage />} />
              <Route path="/empresa/relatorios/pendencias" element={<RelatorioPendenciasEmpresaPage />} />
            </Route>
          </Route>

          {/* Shared routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              <Route path="/chat" element={<ChatPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </RootLayout>
    </BrowserRouter>
  );
}

export default App;
