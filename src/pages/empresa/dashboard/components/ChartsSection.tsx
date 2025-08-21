import React from 'react';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { EvolutionChart } from '@/components/charts/EvolutionChart';
import { DistributionChart, CombinedDistributionChart } from '@/components/charts/DistributionChart';
import { DashboardMetrics } from '@/types/dashboard';

interface ChartsSectionProps {
  data: DashboardMetrics;
  loading: boolean;
}

export function ChartsSection({ data, loading }: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Evolução Mensal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Evolução Mensal</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Acompanhe o crescimento de funcionários e custos ao longo dos últimos meses
        </p>
        <EvolutionChart 
          data={data?.evolucaoMensal} 
          loading={loading}
          height={300}
        />
      </div>
      
      {/* Gráfico de Distribuição por Cargos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-2 mb-4">
          <PieChart className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Distribuição por Cargo</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Visualize como seus funcionários estão distribuídos por cargo
        </p>
        <DistributionChart 
          data={data?.distribuicaoCargos} 
          loading={loading}
          height={300}
        />
      </div>
    </div>
  );
}

// Versão estendida com mais gráficos
export function ExtendedChartsSection({ data, loading }: ChartsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Primeira linha - Gráficos principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Evolução Mensal</h3>
          </div>
          <EvolutionChart 
            data={data?.evolucaoMensal} 
            loading={loading}
            height={300}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Análise Detalhada</h3>
          </div>
          <CombinedDistributionChart 
            cargoData={data?.distribuicaoCargos}
            cnpjData={data?.custosPorCnpj}
            loading={loading}
          />
        </div>
      </div>
      
      {/* Segunda linha - Gráfico de CNPJs se houver muitos dados */}
      {data?.custosPorCnpj && data.custosPorCnpj.length > 3 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-gray-900">Funcionários por CNPJ</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Distribuição de funcionários por filial da empresa
          </p>
          <DistributionChart 
            data={data.custosPorCnpj.map(item => ({
              cargo: item.razao_social || item.cnpj,
              count: item.funcionarios_count
            }))} 
            loading={loading}
            height={300}
            type="bar"
          />
        </div>
      )}
    </div>
  );
}

// Versão compacta para dashboards menores
export function CompactChartsSection({ data, loading }: ChartsSectionProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Resumo Visual</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Evolução (3 meses)</h4>
          <EvolutionChart 
            data={data?.evolucaoMensal?.slice(-3)} 
            loading={loading}
            height={200}
          />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top Cargos</h4>
          <DistributionChart 
            data={data?.distribuicaoCargos?.slice(0, 5)} 
            loading={loading}
            height={200}
          />
        </div>
      </div>
    </div>
  );
}
