
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// CORREÇÃO: Interface que coincide com os dados da SQL
interface CustoPorCnpj {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_count: number; // Mantém o nome da SQL
}

interface CustosPorCnpjChartProps {
  dados: CustoPorCnpj[];
}

const CustosPorCnpjChart = ({ dados }: CustosPorCnpjChartProps) => {
  console.log('📊 [CustosPorCnpjChart] Dados recebidos:', dados);

  // Cores para o gráfico
  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  // CORREÇÃO: Filtrar dados válidos e preparar para o gráfico
  const chartData = dados
    .filter(item => {
      const isValid = item && item.valor_mensal > 0;
      console.log('📋 [CustosPorCnpjChart] Item válido?', isValid, item);
      return isValid;
    })
    .map((item, index) => {
      const chartItem = {
        name: item.razao_social || 'Sem nome',
        value: Number(item.valor_mensal) || 0,
        funcionarios: Number(item.funcionarios_count) || 0, // CORREÇÃO: usar funcionarios_count
        fill: COLORS[index % COLORS.length]
      };
      console.log('📈 [CustosPorCnpjChart] Item do gráfico:', chartItem);
      return chartItem;
    });

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  console.log('💰 [CustosPorCnpjChart] Total calculado:', total);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.funcionarios} funcionários
          </p>
          <p className="text-sm font-medium text-green-600">
            {formatCurrency(data.value)} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  if (!dados || dados.length === 0 || chartData.length === 0) {
    console.log('⚠️ [CustosPorCnpjChart] Nenhum dado para exibir');
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum dado de custo disponível</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de CNPJs */}
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Detalhes por CNPJ</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.fill }}
                  />
                  <div>
                    <p className="text-sm font-medium truncate max-w-32">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.funcionarios} funcionários
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatCurrency(item.value)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {percentage}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CustosPorCnpjChart;
