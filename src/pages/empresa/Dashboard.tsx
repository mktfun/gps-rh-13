import React from 'react';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { useAuth } from '@/hooks/useAuth';
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary';

const Dashboard: React.FC = () => {
  const { user, empresaId } = useAuth();
  const { metrics, loading, error } = useEmpresaDashboardMetrics(empresaId || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center p-8 bg-card rounded-lg shadow-lg max-w-md border">
          <div className="w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Erro ao carregar dashboard
          </h2>
          
          <p className="text-muted-foreground mb-6">
            {error}
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard da Empresa</h1>
        
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Total Funcionários</h3>
              <p className="text-3xl font-bold text-primary">
                {metrics.total_funcionarios}
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Funcionários Ativos</h3>
              <p className="text-3xl font-bold text-green-600">
                {metrics.funcionarios_ativos}
              </p>
            </div>
            
            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Custo Mensal</h3>
              <p className="text-3xl font-bold text-purple-600">
                R$ {metrics.custo_mensal_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;