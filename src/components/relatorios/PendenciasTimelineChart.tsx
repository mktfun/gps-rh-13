
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineVencimentos {
  data_vencimento: string;
  quantidade: number;
  criticas: number;
  urgentes: number;
}

interface PendenciasTimelineChartProps {
  dados: TimelineVencimentos[];
}

const PendenciasTimelineChart: React.FC<PendenciasTimelineChartProps> = ({ dados }) => {
  // Preparar dados ordenados por data
  const chartData = dados
    .map(item => ({
      ...item,
      data_formatada: format(new Date(item.data_vencimento), 'dd/MM', { locale: ptBR }),
      normais: item.quantidade - item.criticas - item.urgentes
    }))
    .sort((a, b) => new Date(a.data_vencimento).getTime() - new Date(b.data_vencimento).getTime())
    .slice(0, 10); // Mostrar apenas próximas 10 datas

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">Data: {label}</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">Críticas:</span>
              <span className="font-semibold text-red-600">{data.criticas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-600">Urgentes:</span>
              <span className="font-semibold text-orange-600">{data.urgentes}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600">Normais:</span>
              <span className="font-semibold text-blue-600">{data.normais}</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="font-semibold">{data.quantidade}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (dados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <Calendar className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhum vencimento encontrado</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          dataKey="data_formatada" 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#94a3b8' }}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#94a3b8' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Bar 
          dataKey="criticas" 
          stackId="a" 
          fill="#EF4444" 
          name="Críticas"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="urgentes" 
          stackId="a" 
          fill="#F59E0B" 
          name="Urgentes"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="normais" 
          stackId="a" 
          fill="#3B82F6" 
          name="Normais"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PendenciasTimelineChart;
