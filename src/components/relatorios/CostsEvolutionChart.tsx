
import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3, TrendingUpIcon, Info } from 'lucide-react';

interface EvolucaoTemporal {
  mes: string;
  mes_nome: string;
  custo_total: number;
  funcionarios: number;
}

interface CostsEvolutionChartProps {
  data: EvolucaoTemporal[];
}

export const CostsEvolutionChart = ({ data }: CostsEvolutionChartProps) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [visibleData, setVisibleData] = useState<string[]>(['funcionarios', 'custo']);

  console.log('📊 [CostsEvolutionChart] Dados recebidos:', data);

  // Toggle visibility of data series
  const toggleDataVisibility = (dataKey: string) => {
    setVisibleData(prev => prev.includes(dataKey) ? prev.filter(key => key !== dataKey) : [...prev, dataKey]);
  };

  // Usar dados reais sem modificação - não inventar dados
  const processedData = data?.map((item) => ({
    mes: item.mes_nome,
    funcionarios: item.funcionarios || 0,
    custo: item.custo_total || 0
  })) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip for both chart types
  const CustomTooltip = ({ active, payload, label }: any) => {
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
                  {entry.dataKey === 'funcionarios' ? 'Funcionários' : entry.dataKey === 'custo' ? 'Custo' : entry.dataKey}
                </span>
              </div>
              <span className="font-medium text-gray-900">
                {entry.dataKey === 'custo' 
                  ? formatCurrency(Number(entry.value))
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

  // Se não há dados ou há poucos dados
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução dos Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <TrendingUp className="h-12 w-12 opacity-50 mb-4" />
            <p>Nenhum dado de evolução disponível</p>
            <p className="text-sm text-center mt-2">
              Não há planos ativos no período selecionado
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se há poucos dados (apenas 1 mês), mostrar aviso
  if (data.length === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução dos Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-blue-800 font-medium mb-1">
                  Dados insuficientes para evolução temporal
                </h4>
                <p className="text-blue-700 text-sm">
                  Plano ativo apenas desde {data[0].mes_nome}. 
                  Aguarde mais alguns meses para visualizar a evolução histórica.
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-gray-700">Funcionários Ativos</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{data[0].funcionarios}</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm font-medium text-gray-700">Custo Mensal</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data[0].custo_total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução dos Custos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Interactive Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Data Visibility Controls */}
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

            {/* Chart Type Controls */}
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

          {/* Chart Area */}
          <ResponsiveContainer width="100%" height={300}>
            {chartType === 'bar' ? (
              <BarChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
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
                  tickFormatter={formatCurrency}
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
              <LineChart
                data={processedData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
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
                  tickFormatter={formatCurrency}
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
        </div>
      </CardContent>
    </Card>
  );
};
