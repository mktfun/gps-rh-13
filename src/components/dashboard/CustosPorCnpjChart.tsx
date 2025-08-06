
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building2 } from 'lucide-react';

// CORREÇÃO: Interface que coincide exatamente com os dados da SQL
interface CustoPorCnpj {
  cnpj: string;
  razao_social: string;
  valor_mensal: number;
  funcionarios_count: number;
}

interface CustosPorCnpjChartProps {
  dados: CustoPorCnpj[];
}

const CustosPorCnpjChart = ({ dados }: CustosPorCnpjChartProps) => {
  console.log('📊 [CustosPorCnpjChart] Dados recebidos:', dados);

  // Cores para o gráfico
  const COLORS = [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
  ];

  // CORREÇÃO: Processar dados corretamente, sem filtros desnecessários
  const chartData = dados
    .filter(item => {
      const isValid = item && typeof item.valor_mensal === 'number' && item.valor_mensal > 0;
      console.log('📋 [CustosPorCnpjChart] Item válido?', isValid, item);
      return isValid;
    })
    .map((item, index) => {
      const chartItem = {
        name: item.razao_social || 'Sem nome',
        value: Number(item.valor_mensal) || 0,
        funcionarios: Number(item.funcionarios_count) || 0,
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
          <p className="font-medium text-gray-900">{data.name}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Funcionários:</span>
            <span className="font-semibold">{data.funcionarios}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Valor:</span>
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(data.value)}
            </span>
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

  if (!dados || dados.length === 0) {
    console.log('⚠️ [CustosPorCnpjChart] Nenhum dado recebido');
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <Building2 className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhum dado de custo disponível</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    console.log('⚠️ [CustosPorCnpjChart] Dados filtrados resultaram em array vazio');
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
        <Building2 className="w-12 h-12 mb-4 opacity-50" />
        <p>Dados de custo não são válidos para exibição</p>
        <p className="text-xs mt-2">Debug: {JSON.stringify(dados)}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Gráfico de Pizza */}
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
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

      {/* Lista de CNPJs */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Detalhes por CNPJ</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {chartData.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
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
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(item.value)}
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

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong>
          <br />
          Dados originais: {JSON.stringify(dados)}
          <br />
          Dados processados: {JSON.stringify(chartData)}
          <br />
          Total: {total}
        </div>
      )}
    </div>
  );
};

export default CustosPorCnpjChart;
