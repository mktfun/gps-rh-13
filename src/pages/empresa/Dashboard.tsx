import React from 'react';
import { useEmpresaDashboardMetrics } from '@/hooks/useEmpresaDashboardMetrics';
import { useAuth } from '@/hooks/useAuth';
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary';
import { DashboardDataFallback } from '@/components/debug/DashboardDataFallback';
import { DashboardDebugPanel } from '@/components/debug/DashboardDebugPanel';

const Dashboard: React.FC = () => {
  const { user, empresaId } = useAuth();
  const { data: metrics, isLoading: loading, error } = useEmpresaDashboardMetrics();

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
            {error instanceof Error ? error.message : String(error)}
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

  // Se não há dados ou os dados estão vazios, mostrar fallback
  if (!metrics || (metrics.totalFuncionarios === 0 && metrics.totalCnpjs === 0)) {
    return (
      <DashboardErrorBoundary>
        <DashboardDebugPanel />
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Dashboard da Empresa</h1>
          <DashboardDataFallback
            onConnect={() => {
              // Navegar para MCP popover
              window.open('#open-mcp-popover', '_blank');
            }}
          />
        </div>
      </DashboardErrorBoundary>
    );
  }

  return (
    <DashboardErrorBoundary>
      <DashboardDebugConsole />
      <TestFunctionAmbiguity />
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard da Empresa</h1>

        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Total Funcionários</h3>
              <p className="text-3xl font-bold text-primary">
                {metrics.totalFuncionarios}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Funcionários Ativos</h3>
              <p className="text-3xl font-bold text-green-600">
                {metrics.funcionariosAtivos}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Funcionários Pendentes</h3>
              <p className="text-3xl font-bold text-yellow-600">
                {metrics.funcionariosPendentes}
              </p>
            </div>

            <div className="bg-card p-6 rounded-lg shadow border">
              <h3 className="text-lg font-medium text-muted-foreground">Custo Mensal</h3>
              <p className="text-3xl font-bold text-purple-600">
                R$ {metrics.custoMensalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        )}

        {metrics && metrics.custosPorCnpj.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Custos por CNPJ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.custosPorCnpj.map((cnpj, index) => (
                <div key={index} className="bg-card p-4 rounded-lg shadow border">
                  <h4 className="font-medium text-sm text-muted-foreground">{cnpj.cnpj}</h4>
                  <p className="font-semibold">{cnpj.razao_social}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-muted-foreground">{cnpj.funcionarios_count} funcionários</span>
                    <span className="font-bold text-green-600">
                      R$ {cnpj.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;
