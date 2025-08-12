
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';
import { format } from 'date-fns';

interface Props {
  pendencias: PendenciaItem[];
}

const GraficoTimelineVencimentos: React.FC<Props> = ({ pendencias }) => {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    pendencias.forEach(p => {
      const d = p.data_vencimento ? new Date(p.data_vencimento) : null;
      const key = d ? format(d, 'yyyy-MM') : 'Sem data';
      map.set(key, (map.get(key) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([mes, total]) => ({ mes, total }));
  }, [pendencias]);

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground mb-2">Timeline de Vencimentos</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default GraficoTimelineVencimentos;
