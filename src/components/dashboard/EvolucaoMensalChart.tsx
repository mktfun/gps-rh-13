
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface EvolucaoMensal {
  mes: string;
  funcionarios: number;
  custo: number;
}

interface EvolucaoMensalChartProps {
  dados: EvolucaoMensal[];
}

const EvolucaoMensalChart = ({ dados }: EvolucaoMensalChartProps) => {
  // Custom tooltip para o gráfico de barras
  const CustomTooltip = ({ 
    active, 
    payload, 
    label 
  }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold mb-3 text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between mb-2 last:mb-0">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-700">
                  {entry.dataKey === 'funcionarios' ? 'Funcionários' : 
                   entry.dataKey === 'custo' ? 'Custo' : entry.dataKey}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {entry.dataKey === 'custo' 
                  ? formatCurrency(entry.value as number)
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Evolução Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
            <p>Nenhum dado disponível</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                yAxisId="left"
              />
              <YAxis 
                className="text-xs fill-gray-600"
                tick={{ fontSize: 12 }}
                axisLine={{ stroke: '#E5E7EB' }}
                tickLine={{ stroke: '#E5E7EB' }}
                yAxisId="right"
                orientation="right"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="funcionarios" 
                fill="#3B82F6"
                name="Funcionários"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
              />
              <Bar 
                dataKey="custo" 
                fill="#10B981" 
                name="Custo (R$)"
                radius={[4, 4, 0, 0]}
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default EvolucaoMensalChart;
