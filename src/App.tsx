import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import LandingPage from '@/pages/LandingPage';
import Login from '@/pages/Login';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import CorretoraspPage from '@/pages/admin/CorretoraspPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProtectedCorretoraRoute from '@/components/auth/ProtectedCorretoraRoute';
import RootLayout from '@/components/layout/RootLayout';
import ChatPage from '@/pages/ChatPage';
import PerfilPage from '@/pages/PerfilPage';
import ConfiguracoesPage from '@/pages/ConfiguracoesPage';
import NotFound from '@/pages/NotFound';
import CorretoraDashboard from '@/pages/corretora/CorretoraDashboard';
import EmpresasPage from '@/pages/corretora/EmpresasPage';
import FuncionariosPendentesPage from '@/pages/corretora/FuncionariosPendentesPage';
import PendenciasExclusaoPage from '@/pages/corretora/PendenciasExclusaoPage';
import AuditoriaPage from '@/pages/corretora/AuditoriaPage';
import EmpresaDashboard from '@/pages/empresa/EmpresaDashboard';
import FuncionariosPage from '@/pages/empresa/FuncionariosPage';
import PlanosPage from '@/pages/empresa/PlanosPage';
import AtivarFuncionarioPage from '@/pages/corretora/AtivarFuncionarioPage';
import DadosPlanosPage from '@/pages/corretora/DadosPlanosPage';
import PlanoDetalhesPage from '@/pages/corretora/PlanoDetalhesPage';
import RelatorioFuncionarios from '@/pages/empresa/relatorios/RelatorioFuncionarios';
import CustosEmpresa from '@/pages/empresa/relatorios/CustosEmpresa';
import Pendencias from '@/pages/empresa/relatorios/Pendencias';
import EnhancedDashboard from '@/pages/corretora/EnhancedDashboard';
import SegurosDeVidaEmpresas from '@/pages/corretora/seguros-de-vida/SegurosDeVidaEmpresas';
import SegurosDeVidaCnpj from '@/pages/corretora/seguros-de-vida/SegurosDeVidaCnpj';
import RelatorioFinanceiro from '@/pages/corretora/relatorios/RelatorioFinanceiro';
import RelatorioFuncionariosCorretora from '@/pages/corretora/relatorios/RelatorioFuncionarios';
import RelatorioMovimentacao from '@/pages/corretora/relatorios/RelatorioMovimentacao';

function App() {
  return (
    <QueryClient>
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
          <Route path="/empresa/planos-saude" element={<Navigate to="/empresa/planos" replace />} />

          {/* Protected admin routes */}
          <Route path="/admin/*" element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="dashboard" element={<RootLayout><AdminDashboard /></RootLayout>} />
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
            <Route path="dados-planos" element={<RootLayout><DadosPlanosPage /></RootLayout>} />
            <Route path="plano/:planoId" element={<RootLayout><PlanoDetalhesPage /></RootLayout>} />
            
            {/* Seguros de Vida Routes */}
            <Route path="seguros-de-vida/empresas" element={<RootLayout><SegurosDeVidaEmpresas /></RootLayout>} />
            <Route path="seguros-de-vida/:empresaId/cnpj/:cnpjId" element={<RootLayout><SegurosDeVidaCnpj /></RootLayout>} />

            {/* Relatórios routes */}
            <Route path="relatorios/financeiro" element={<RootLayout><RelatorioFinanceiro /></RootLayout>} />
            <Route path="relatorios/funcionarios" element={<RootLayout><RelatorioFuncionariosCorretora /></RootLayout>} />
            <Route path="relatorios/movimentacao" element={<RootLayout><RelatorioMovimentacao /></RootLayout>} />
          </Route>

          {/* Protected empresa routes */}
          <Route path="/empresa/*" element={<ProtectedRoute requiredRole="empresa" />}>
            <Route path="dashboard" element={<RootLayout><EmpresaDashboard /></RootLayout>} />
            <Route path="funcionarios" element={<RootLayout><FuncionariosPage /></RootLayout>} />
            <Route path="planos" element={<RootLayout><PlanosPage /></RootLayout>} />

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
    </QueryClient>
  );
}

export default App;
