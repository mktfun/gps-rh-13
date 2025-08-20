import React, { useState } from 'react';
import { RefreshCw, Download, Settings, Bug } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ErrorState } from '@/components/ui/ErrorState';
import { PageLoadingSpinner } from '@/components/ui/LoadingSpinner';

import { MetricsGrid } from './components/MetricsGrid';
import { ChartsSection, ExtendedChartsSection } from './components/ChartsSection';
import { TableSection, SimpleTableSection } from './components/TableSection';

export default function DashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Usar fallback para o ID da empresa que sabemos que tem dados
  const empresaId = user?.empresa_id || user?.id || 'f5d59a88-965c-4e3a-b767-66a8f0df4e1a';

  console.log('🏢 [DashboardPage] user:', user);
  console.log('🏢 [DashboardPage] empresaId final:', empresaId);

  const { data, isLoading, error, refetch } = useDashboardData(empresaId);
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('🏢 [DashboardPage] Estado atual:', {
    data,
    isLoading,
    error: error?.message,
    empresaId: user?.empresa_id
  });

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar cache e recarregar
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      await refetch();
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = () => {
    // TODO: Implementar exportação de relatório
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const handleDebugData = () => {
    console.group('🐛 [DEBUG] Dados do Dashboard Reformulado');
    console.log('Dados completos:', data);
    console.log('Métricas principais:', {
      totalFuncionarios: data?.totalFuncionarios,
      funcionariosAtivos: data?.funcionariosAtivos,
      funcionariosPendentes: data?.funcionariosPendentes,
      totalCnpjs: data?.totalCnpjs,
      custoMensalTotal: data?.custoMensalTotal
    });
    console.log('Evolução mensal:', data?.evolucaoMensal);
    console.log('Distribuição de cargos:', data?.distribuicaoCargos);
    console.log('Custos por CNPJ:', data?.custosPorCnpj);
    console.log('Plano principal:', data?.planoPrincipal);
    console.groupEnd();
    toast.info('Dados de debug enviados para console (F12)');
  };

  // Listener para navegação entre tabs via eventos customizados
  React.useEffect(() => {
    const handleNavigateToCnpjs = () => {
      setActiveTab('cnpjs');
    };

    window.addEventListener('navigate-to-cnpjs', handleNavigateToCnpjs);
    return () => window.removeEventListener('navigate-to-cnpjs', handleNavigateToCnpjs);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard da Empresa</h1>
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          </div>
          <PageLoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-1 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard da Empresa</h1>
              <p className="text-gray-600">Erro ao carregar dados</p>
            </div>
          </div>
          <ErrorState 
            error={error} 
            retry={handleRefreshData}
            title="Erro ao carregar dashboard"
            description="Não foi possível carregar os dados do dashboard. Verifique sua conexão e tente novamente."
          />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-1 flex-col gap-6 md:gap-8">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <ErrorState 
            title="Nenhum dado encontrado"
            description="Não há dados disponíveis para esta empresa no momento."
            retry={handleRefreshData}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="max-w-7xl mx-auto space-y-8 w-full px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="h-12 w-1 bg-gradient-to-b from-blue-600 to-purple-600 rounded-full"></div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Dashboard da Empresa
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Bem-vindo, <span className="font-medium text-blue-600">{user?.email}</span>!
                  Acompanhe suas métricas e indicadores em tempo real.
                </p>
              </div>
            </div>

            {/* Ações do Header */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshData}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Atualizar
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDebugData}
                className="flex items-center gap-2"
              >
                <Bug className="h-4 w-4" />
                Debug
              </Button>
            </div>
          </div>
        </div>

        {/* Navegação por Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="cnpjs">CNPJs e Custos</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Métricas Principais */}
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <MetricsGrid 
                data={data} 
                loading={isLoading} 
                empresaId={user?.empresa_id}
              />
            </div>

            {/* Gráficos */}
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              <ExtendedChartsSection 
                data={data} 
                loading={isLoading} 
              />
            </div>

            {/* Plano Principal */}
            {data.planoPrincipal && (
              <div className="animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Plano Principal</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Seguradora</h4>
                      <p className="text-lg font-semibold text-gray-900">{data.planoPrincipal.seguradora}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Empresa</h4>
                      <p className="text-base text-gray-900">{data.planoPrincipal.razao_social}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Tipo de Seguro</h4>
                      <p className="text-base text-gray-900 capitalize">{data.planoPrincipal.tipo_seguro}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-600 mb-1">Valor Mensal</h4>
                      <p className="text-xl font-bold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(data.planoPrincipal.valor_mensal)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cnpjs" className="space-y-8">
            {/* Métricas específicas de CNPJs */}
            <div className="animate-fade-in opacity-0" style={{ animationFillMode: 'forwards' }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {data.totalCnpjs}
                  </div>
                  <div className="text-sm text-gray-600">CNPJs Cadastrados</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {data.totalFuncionarios}
                  </div>
                  <div className="text-sm text-gray-600">Total de Funcionários</div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm border text-center">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(data.custoMensalTotal)}
                  </div>
                  <div className="text-sm text-gray-600">Custo Total Mensal</div>
                </div>
              </div>
            </div>

            {/* Tabela de CNPJs */}
            <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <TableSection 
                data={data} 
                loading={isLoading} 
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
