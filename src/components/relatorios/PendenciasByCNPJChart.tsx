import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Building } from 'lucide-react';

interface PendenciasPorCnpj {
  cnpj: string;
  razao_social: string;
  total_pendencias: number;
  criticas: number;
  urgentes: number;
}

interface PendenciasByCNPJChartProps {
  dados: PendenciasPorCnpj[];
}

const PendenciasByCNPJChart: React.FC<PendenciasByCNPJChartProps> = ({ dados }) => {
  // Preparar dados ordenados por total de pendências
  const chartData = dados
    .sort((a, b) => b.total_pendencias - a.total_pendencias)
    .slice(0, 8) // Mostrar apenas top 8 CNPJs
    .map(item => ({
      ...item,
      nome_curto: item.razao_social.length > 20
        ? item.razao_social.substring(0, 20) + '...'
        : item.razao_social,
      normais: item.total_pendencias - item.criticas - item.urgentes
    }));

  // Debug dos dados
  console.log('🔍 [PendenciasByCNPJChart] Dados recebidos:', dados);
  console.log('📊 [PendenciasByCNPJChart] Chart data processado:', chartData);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg max-w-xs">
          <p className="font-medium text-gray-900 mb-2">{data.razao_social}</p>
          <p className="text-sm text-gray-600 mb-2">CNPJ: {data.cnpj}</p>
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
                <span className="font-semibold">{data.total_pendencias}</span>
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
        <Building className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhuma pendência por CNPJ encontrada</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart 
        data={chartData} 
        layout="horizontal"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
        <XAxis 
          type="number"
          tick={{ fontSize: 12 }}
          tickLine={{ stroke: '#94a3b8' }}
        />
        <YAxis 
          type="category"
          dataKey="nome_curto"
          tick={{ fontSize: 11 }}
          tickLine={{ stroke: '#94a3b8' }}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="criticas" 
          stackId="a" 
          fill="#EF4444"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="urgentes" 
          stackId="a" 
          fill="#F59E0B"
          radius={[0, 0, 0, 0]}
        />
        <Bar 
          dataKey="normais" 
          stackId="a" 
          fill="#3B82F6"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PendenciasByCNPJChart;
