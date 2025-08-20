import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { EvolutionData, ChartProps } from '@/types/dashboard';
import { formatCurrency, formatMonthName } from '@/utils/formatters';
import { ChartErrorState, ChartEmptyState } from '@/components/ui/ErrorState';
import { CardLoadingSkeleton } from '@/components/ui/LoadingSpinner';

interface EvolutionChartProps extends ChartProps {
  data?: EvolutionData[];
}

export function EvolutionChart({ data, loading, height = 300 }: EvolutionChartProps) {
  if (loading) {
    return <CardLoadingSkeleton />;
  }

  if (!data || data.length === 0) {
    return <ChartEmptyState message="Nenhum dado de evolução disponível" />;
  }

  // Processar dados para o gráfico
  const chartData = data.map(item => ({
    ...item,
    mesFormatado: formatMonthName(item.mes),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'funcionarios' 
                ? `Funcionários: ${entry.value}`
                : `Custo: ${formatCurrency(entry.value)}`
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mesFormatado" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            yAxisId="left" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 12 }}
            stroke="#666"
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            yAxisId="left"
            type="monotone" 
            dataKey="funcionarios" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            name="funcionarios"
          />
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="custo" 
            stroke="#10b981" 
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2, fill: '#fff' }}
            name="custo"
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
      
      {/* Legenda personalizada */}
      <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500"></div>
          <span className="text-sm text-gray-600">Funcionários</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-green-500 border-dashed border-t-2"></div>
          <span className="text-sm text-gray-600">Custo Mensal</span>
        </div>
      </div>
    </div>
  );
}
