
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, BarChart3, TrendingUpIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EvolucaoMensal {
  mes: string;
  funcionarios: number;
  custo: number;
}

interface EvolucaoMensalChartProps {
  dados: EvolucaoMensal[];
}

const EvolucaoMensalChart = ({ dados }: EvolucaoMensalChartProps) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [visibleData, setVisibleData] = useState<string[]>(['funcionarios', 'custo']);

  console.log('📊 [EvolucaoMensalChart] Dados recebidos:', dados);

  // Toggle visibility of data series
  const toggleDataVisibility = (dataKey: string) => {
    setVisibleData(prev => 
      prev.includes(dataKey) 
        ? prev.filter(key => key !== dataKey)
        : [...prev, dataKey]
    );
  };

  // Custom tooltip para ambos os tipos de gráfico
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
                  ? new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(Number(entry.value))
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

  if (!dados || dados.length === 0) {
    console.log('⚠️ [EvolucaoMensalChart] Nenhum dado para exibir');
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-gray-500">
        <TrendingUp className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhum dado de evolução disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles Interativos */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* Grupo 1: Visualizar Dados */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Visualizar Dados:</span>
          <div className="flex gap-2">
            <Button
              variant={visibleData.includes('funcionarios') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleDataVisibility('funcionarios')}
              className="text-xs"
            >
              Funcionários
            </Button>
            <Button
              variant={visibleData.includes('custo') ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleDataVisibility('custo')}
              className="text-xs"
            >
              Custo (R$)
            </Button>
          </div>
        </div>

        {/* Grupo 2: Tipo de Gráfico */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-gray-700">Tipo de Gráfico:</span>
          <div className="flex gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('bar')}
              className="flex items-center gap-1 text-xs"
            >
              <BarChart3 className="w-3 h-3" />
              Barras
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setChartType('line')}
              className="flex items-center gap-1 text-xs"
            >
              <TrendingUpIcon className="w-3 h-3" />
              Linhas
            </Button>
          </div>
        </div>
      </div>

      {/* Área do Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        {chartType === 'bar' ? (
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
            {visibleData.includes('funcionarios') && (
              <Bar 
                dataKey="funcionarios" 
                fill="#3B82F6"
                name="Funcionários"
                radius={[4, 4, 0, 0]}
                yAxisId="left"
              />
            )}
            {visibleData.includes('custo') && (
              <Bar 
                dataKey="custo" 
                fill="#10B981" 
                name="Custo (R$)"
                radius={[4, 4, 0, 0]}
                yAxisId="right"
              />
            )}
          </BarChart>
        ) : (
          <LineChart data={dados} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
            {visibleData.includes('funcionarios') && (
              <Line 
                type="monotone" 
                dataKey="funcionarios" 
                stroke="#3B82F6"
                strokeWidth={3}
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                name="Funcionários"
                yAxisId="left"
              />
            )}
            {visibleData.includes('custo') && (
              <Line 
                type="monotone" 
                dataKey="custo" 
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Custo (R$)"
                yAxisId="right"
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug EvolucaoMensal:</strong>
          <br />
          {JSON.stringify(dados, null, 2)}
        </div>
      )}
    </div>
  );
};

export default EvolucaoMensalChart;
