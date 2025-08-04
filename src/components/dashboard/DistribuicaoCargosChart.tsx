
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface DistribuicaoCargo {
  cargo: string;
  count: number;
}

interface DistribuicaoCargosChartProps {
  dados: DistribuicaoCargo[];
}

const DistribuicaoCargosChart = ({ dados }: DistribuicaoCargosChartProps) => {
  // Cores para o gráfico
  const COLORS = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
  ];

  // Custom tooltip para o gráfico de pizza
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = dados.reduce((sum, item) => sum + item.count, 0);
      const percentage = ((data.count / total) * 100).toFixed(1);
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{data.cargo}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Quantidade:</span>
            <span className="font-semibold">{data.count}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Percentual:</span>
            <span className="font-semibold">{percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-600" />
          Distribuição por Cargos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p>Nenhum dado disponível</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dados}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
                dataKey="count"
                nameKey="cargo"
                stroke="#FFFFFF"
                strokeWidth={3}
              >
                {dados.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                verticalAlign="middle" 
                align="right" 
                formatter={(value) => <span className="text-sm">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DistribuicaoCargosChart;
