import React from 'react';
import { Users, Building2, DollarSign, Clock, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { DashboardMetrics } from '@/types/dashboard';
import { useDashboardTrends } from '@/hooks/useDashboardData';

interface MetricsGridProps {
  data: DashboardMetrics;
  loading: boolean;
  empresaId?: string;
}

export function MetricsGrid({ data, loading, empresaId }: MetricsGridProps) {
  const { funcionariosTrend } = useDashboardTrends(empresaId);

  const handleFuncionariosClick = () => {
    window.location.href = '/empresa/funcionarios';
  };

  const handleCnpjsClick = () => {
    // Navigate to CNPJs section or toggle to CNPJs tab
    const event = new CustomEvent('navigate-to-cnpjs');
    window.dispatchEvent(event);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <MetricCard
        title="Total de Funcionários"
        value={formatNumber(data?.totalFuncionarios || 0)}
        subtitle={`${formatNumber(data?.funcionariosAtivos || 0)} ativos`}
        trend={funcionariosTrend}
        loading={loading}
        icon={<Users className="h-6 w-6" />}
        onClick={handleFuncionariosClick}
        className="hover:border-blue-300 transition-colors"
      />
      
      <MetricCard
        title="CNPJs Ativos"
        value={formatNumber(data?.totalCnpjs || 0)}
        subtitle="Filiais ativas"
        loading={loading}
        icon={<Building2 className="h-6 w-6" />}
        onClick={handleCnpjsClick}
        className="hover:border-green-300 transition-colors"
      />
      
      <MetricCard
        title="Custo Mensal"
        value={formatCurrency(data?.custoMensalTotal || 0)}
        subtitle="Total em seguros"
        loading={loading}
        icon={<DollarSign className="h-6 w-6" />}
        className="border-green-200 bg-green-50/50"
      />
      
      <MetricCard
        title="Pendências"
        value={formatNumber(data?.funcionariosPendentes || 0)}
        subtitle="Aguardando ativação"
        loading={loading}
        icon={<Clock className="h-6 w-6" />}
        className={`${
          (data?.funcionariosPendentes || 0) > 0 
            ? "border-orange-200 bg-orange-50/50" 
            : "border-green-200 bg-green-50/50"
        } transition-colors`}
      />
    </div>
  );
}

// Componente alternativo para layout em grid responsivo
export function MetricsGridCompact({ data, loading }: { data: DashboardMetrics; loading: boolean }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatNumber(data?.totalFuncionarios || 0)}
            </div>
            <div className="text-sm text-gray-600">Funcionários</div>
          </>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatNumber(data?.totalCnpjs || 0)}
            </div>
            <div className="text-sm text-gray-600">CNPJs</div>
          </>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className="text-lg font-bold text-green-600 mb-1">
              {formatCurrency(data?.custoMensalTotal || 0)}
            </div>
            <div className="text-sm text-gray-600">Custo Mensal</div>
          </>
        )}
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow-sm border text-center">
        {loading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <>
            <div className={`text-2xl font-bold mb-1 ${
              (data?.funcionariosPendentes || 0) > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {formatNumber(data?.funcionariosPendentes || 0)}
            </div>
            <div className="text-sm text-gray-600">Pendências</div>
          </>
        )}
      </div>
    </div>
  );
}
