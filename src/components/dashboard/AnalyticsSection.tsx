
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import ChartCard from './ChartCard';

interface AnalyticsSectionProps {
  estatisticasMensais: any[];
  distribuicaoStatus: any[];
  isMetricsLoading: boolean;
  isDistribuicaoLoading: boolean;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AnalyticsSection = ({
  estatisticasMensais,
  distribuicaoStatus,
  isMetricsLoading,
  isDistribuicaoLoading
}: AnalyticsSectionProps) => {
  // Custom tooltip para o gráfico de barras
  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-lg animate-scale-in">
          <p className="font-semibold mb-3 text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">
                  {entry.dataKey === 'empresas' ? 'Empresas' : 
                   entry.dataKey === 'funcionarios' ? 'Funcionários' : 
                   entry.dataKey === 'receita' ? 'Receita' : entry.dataKey}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {entry.dataKey === 'receita' 
                  ? `R$ ${Number(entry.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : entry.value
                }
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">📈 Analytics</h2>
          <p className="text-sm text-gray-600">Análise detalhada dos dados da sua corretora</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <ChartCard
            title="Estatísticas Mensais"
            description="Evolução de empresas, funcionários e receita"
          >
            {isMetricsLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : estatisticasMensais.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={estatisticasMensais} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" opacity={0.5} />
                  <XAxis 
                    dataKey="mes" 
                    className="text-xs fill-gray-600"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  <YAxis 
                    className="text-xs fill-gray-600"
                    tick={{ fontSize: 12 }}
                    axisLine={{ stroke: '#E5E7EB' }}
                    tickLine={{ stroke: '#E5E7EB' }}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="empresas" 
                    fill="#3B82F6" 
                    name="Empresas"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="funcionarios" 
                    fill="#10B981" 
                    name="Funcionários"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="receita" 
                    fill="#F59E0B" 
                    name="Receita (R$)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
                <svg className="w-12 h-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>Nenhum dado disponível</p>
              </div>
            )}
          </ChartCard>
        </div>

        <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <ChartCard
            title="Distribuição por Status"
            description="Status dos funcionários em tempo real"
          >
            {isDistribuicaoLoading ? (
              <div className="flex items-center justify-center h-[350px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={distribuicaoStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, percent }) => `${status}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="status"
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  >
                    {distribuicaoStatus?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #E5E7EB',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
