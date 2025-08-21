import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { CargoDistribution, ChartProps } from '@/types/dashboard';
import { getChartColors } from '@/utils/formatters';
import { ChartEmptyState } from '@/components/ui/ErrorState';
import { CardLoadingSkeleton } from '@/components/ui/LoadingSpinner';

interface DistributionChartProps extends ChartProps {
  data?: CargoDistribution[];
  type?: 'pie' | 'bar';
}

export function DistributionChart({ data, loading, height = 300, type = 'pie' }: DistributionChartProps) {
  if (loading) {
    return <CardLoadingSkeleton />;
  }

  if (!data || data.length === 0) {
    return <ChartEmptyState message="Nenhum dado de distribuição disponível" />;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.cargo}</p>
          <p className="text-sm text-gray-600">
            {data.count} funcionário{data.count !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (type === 'bar') {
    return (
      <div className="w-full">
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="cargo" 
              tick={{ fontSize: 12 }}
              stroke="#666"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              stroke="#666"
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="count" 
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Pie Chart (padrão)
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Não mostrar labels para fatias muito pequenas
    
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={80}
            fill="#8884d8"
            dataKey="count"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getChartColors(index)} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada */}
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: getChartColors(index) }}
              ></div>
              <span className="text-gray-600 truncate" title={item.cargo}>
                {item.cargo} ({item.count})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente combinado para mostrar distribuição de cargos e CNPJs
export function CombinedDistributionChart({ 
  cargoData, 
  cnpjData, 
  loading 
}: { 
  cargoData?: CargoDistribution[]; 
  cnpjData?: any[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Distribuição por Cargo</h4>
        <DistributionChart data={cargoData} loading={loading} height={250} />
      </div>
      
      {cnpjData && cnpjData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Top CNPJs por Funcionários</h4>
          <DistributionChart 
            data={cnpjData.slice(0, 5).map(item => ({
              cargo: item.razao_social || item.cnpj,
              count: item.funcionarios_count
            }))} 
            loading={loading} 
            height={250}
            type="bar"
          />
        </div>
      )}
    </div>
  );
}
