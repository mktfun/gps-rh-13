
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { FileText } from 'lucide-react';

interface PendenciasPorTipo {
  tipo: string;
  quantidade: number;
  percentual: number;
}

interface PendenciasByTypeChartProps {
  dados: PendenciasPorTipo[];
}

const PendenciasByTypeChart: React.FC<PendenciasByTypeChartProps> = ({ dados }) => {
  // Cores específicas para cada tipo
  const COLORS = {
    documentacao: '#3B82F6', // blue-500
    ativacao: '#10B981',      // emerald-500
    alteracao: '#F59E0B',     // amber-500
    cancelamento: '#EF4444'   // red-500
  };

  // Mapear tipos para labels em português
  const LABELS = {
    documentacao: 'Documentação',
    ativacao: 'Ativação',
    alteracao: 'Alteração',
    cancelamento: 'Cancelamento'
  };

  // Preparar dados para o gráfico
  const chartData = dados.map(item => ({
    ...item,
    name: LABELS[item.tipo as keyof typeof LABELS] || item.tipo,
    fill: COLORS[item.tipo as keyof typeof COLORS] || '#8B5CF6'
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Quantidade:</span>
            <span className="font-semibold">{data.quantidade}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Percentual:</span>
            <span className="font-semibold">{data.percentual.toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (dados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <FileText className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhuma pendência encontrada</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="quantidade"
          stroke="#FFFFFF"
          strokeWidth={3}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
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
  );
};

export default PendenciasByTypeChart;
