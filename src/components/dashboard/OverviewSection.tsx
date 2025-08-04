
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface OverviewSectionProps {
  estatisticasMensais: Array<{
    mes: string;
    funcionarios: number;
    empresas: number;
    receita: number;
  }>;
  distribuicaoStatus: Array<{
    status: string;
    count: number;
  }>;
  isMetricsLoading: boolean;
  isDistribuicaoLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const OverviewSection = ({
  estatisticasMensais,
  distribuicaoStatus,
  isMetricsLoading,
  isDistribuicaoLoading
}: OverviewSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">📊 Visão Geral</h2>
          <p className="text-sm text-gray-600">Estatísticas e análises do sistema</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Estatísticas Mensais */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            {isMetricsLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={estatisticasMensais}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="funcionarios" stroke="#8884d8" name="Funcionários" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribuição por Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isDistribuicaoLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {distribuicaoStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OverviewSection;
