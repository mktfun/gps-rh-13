
import React, { useMemo } from 'react';
import { Pie, PieChart, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';

interface Props {
  pendencias: PendenciaItem[];
}

const COLORS = ['hsl(var(--destructive))', 'hsl(var(--primary))', 'hsl(var(--muted-foreground))', 'hsl(var(--secondary))'];

const GraficoPendenciasPorTipo: React.FC<Props> = ({ pendencias }) => {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    pendencias.forEach(p => {
      const key = p.tipo || 'outros';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [pendencias]);

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground mb-2">Pendências por Tipo</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50}>
              {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default GraficoPendenciasPorTipo;
