
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

interface FuncionariosPorCNPJ {
  cnpj: string;
  razao_social: string;
  funcionarios_ativos: number;
  funcionarios_inativos: number;
  total: number;
}

interface FuncionariosByCNPJChartProps {
  data: FuncionariosPorCNPJ[];
}

export const FuncionariosByCNPJChart = ({ data }: FuncionariosByCNPJChartProps) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Funcionários Ativos:</span>
              <span className="font-semibold text-green-600">{payload[0].value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Funcionários Inativos:</span>
              <span className="font-semibold text-red-600">{payload[1].value}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-semibold">{(payload[0].value + payload[1].value)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((item) => ({
    name: item.razao_social.length > 20 
      ? `${item.razao_social.substring(0, 20)}...` 
      : item.razao_social,
    funcionarios_ativos: item.funcionarios_ativos,
    funcionarios_inativos: item.funcionarios_inativos,
    razao_social_completa: item.razao_social
  }));

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Funcionários por CNPJ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Building className="h-12 w-12 opacity-50 mb-4" />
            <p>Nenhum dado de funcionários por CNPJ disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Funcionários por CNPJ
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 10 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="funcionarios_ativos" 
              stackId="a"
              fill="#10b981" 
              name="Ativos"
            />
            <Bar 
              dataKey="funcionarios_inativos" 
              stackId="a"
              fill="#ef4444" 
              name="Inativos"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
