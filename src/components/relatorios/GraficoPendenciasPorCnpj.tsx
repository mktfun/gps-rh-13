
import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';

interface Props {
  pendencias: PendenciaItem[];
}

const GraficoPendenciasPorCnpj: React.FC<Props> = ({ pendencias }) => {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    pendencias.forEach(p => {
      const key = p.cnpj_razao_social || 'Sem razão social';
      map.set(key, (map.get(key) || 0) + 1);
    });
    // Top 10 por quantidade
    return Array.from(map.entries())
      .map(([cnpj, total]) => ({ cnpj, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [pendencias]);

  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground mb-2">Pendências por CNPJ (Top 10)</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="cnpj" width={160} />
            <Tooltip />
            <Bar dataKey="total" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default GraficoPendenciasPorCnpj;
