
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { OperationalIntelligencePanel } from '@/components/dashboard/OperationalIntelligencePanel';
import SmartActionsSection from '@/components/dashboard/SmartActionsSection';
import TopEmpresasReceita from '@/components/dashboard/TopEmpresasReceita';
import InsightsAutomaticos from '@/components/dashboard/InsightsAutomaticos';
import ActionsNeededSection from '@/components/dashboard/ActionsNeededSection';

const CorretoraDashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Dashboard Inteligente
        </h1>
        <p className="text-gray-600 mt-2">
          Bem-vindo, <span className="font-medium text-blue-600">{user?.email}</span>! 
          Seu painel de controle inteligente está sempre atualizado.
        </p>
      </div>

      {/* Painel Operacional Inteligente - Seção Principal */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">🎯 Inteligência Operacional</h2>
        </div>
        <OperationalIntelligencePanel />
      </div>

      {/* Smart Actions - Seção de Ações */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">⚡ Ações Inteligentes</h2>
        </div>
        <SmartActionsSection />
      </div>

      {/* Grid de Análises */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Empresas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
            <h2 className="text-xl font-semibold">🏢 Top Empresas</h2>
          </div>
          <TopEmpresasReceita />
        </div>

        {/* Insights Automáticos */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-yellow-500 rounded-full"></div>
            <h2 className="text-xl font-semibold">💡 Insights Automáticos</h2>
          </div>
          <InsightsAutomaticos />
        </div>
      </div>

      {/* Ações Detalhadas - Seção de Backup */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">📋 Ações Detalhadas</h2>
        </div>
        <ActionsNeededSection />
      </div>
    </div>
  );
};

export default CorretoraDashboard;
