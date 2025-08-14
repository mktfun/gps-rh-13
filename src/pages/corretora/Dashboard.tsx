import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { OperationalIntelligencePanel } from '@/components/dashboard/OperationalIntelligencePanel';
import SmartActionsSection from '@/components/dashboard/SmartActionsSection';
import TopEmpresasReceita from '@/components/dashboard/TopEmpresasReceita';
import InsightsAutomaticos from '@/components/dashboard/InsightsAutomaticos';
import ActionsNeededSection from '@/components/dashboard/ActionsNeededSection';
import { FinancialDataDebug } from '@/components/debug/FinancialDataDebug';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
const CorretoraDashboard = () => {
  const { user } = useAuth();
  const [showDebug, setShowDebug] = useState(false);

  if (!user) {
    return <DashboardLoadingState />;
  }
  return <div className="space-y-8">
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
          <h2 className="text-xl font-semibold">�� Inteligência Operacional</h2>
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
      

      {/* Ações Detalhadas - Seção de Backup */}
      
    </div>;
};
export default CorretoraDashboard;
