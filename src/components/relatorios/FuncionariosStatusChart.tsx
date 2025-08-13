import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChartIcon } from 'lucide-react';

interface DistribuicaoStatus {
  status: string;
  quantidade: number;
  percentual: number;
}

interface FuncionariosStatusChartProps {
  data: DistribuicaoStatus[];
}

const STATUS_COLORS: Record<string, string> = {
  'ativo': '#10b981',
  'pendente': '#f59e0b',
  'desativado': '#ef4444',
  'exclusao_solicitada': '#dc2626',
  'pendente_exclusao': '#b91c1c',
  'arquivado': '#6b7280',
  'edicao_solicitada': '#8b5cf6'
};

const STATUS_LABELS: Record<string, string> = {
  'ativo': 'Ativo',
  'pendente': 'Pendente',
  'desativado': 'Desativado',
  'exclusao_solicitada': 'Exclusão Solicitada',
  'pendente_exclusao': 'Pendente Exclusão',
  'arquivado': 'Arquivado',
  'edicao_solicitada': 'Edição Solicitada'
};

export const FuncionariosStatusChart = ({ data }: FuncionariosStatusChartProps) => {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const label = STATUS_LABELS[data.status] || data.status;
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Quantidade:</span>
              <span className="font-semibold">{data.quantidade}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Percentual:</span>
              <span className="font-semibold">{data.percentual.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((item) => ({
    ...item,
    name: STATUS_LABELS[item.status] || item.status,
    fill: STATUS_COLORS[item.status] || '#6b7280'
  }));

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <PieChartIcon className="h-12 w-12 opacity-50 mb-4" />
            <p>Nenhum dado de distribuição disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="quantidade"
              nameKey="name"
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
      </CardContent>
    </Card>
  );
};
