
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';

interface Props {
  pendencias: PendenciaItem[];
}

const KpiCardGrid: React.FC<Props> = ({ pendencias }) => {
  const total = pendencias.length;
  const criticas = pendencias.filter(p => p.prioridade === 'critico').length;
  const urgentes = pendencias.filter(p => p.prioridade === 'urgente').length;
  const normais = pendencias.filter(p => p.prioridade === 'normal').length;

  const Item = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <Card className="p-4 flex flex-col gap-2">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      <Badge className={color}>{value > 0 ? 'em aberto' : 'ok'}</Badge>
    </Card>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Item label="Total" value={total} color="bg-primary/10 text-primary" />
      <Item label="Críticas" value={criticas} color="bg-destructive/10 text-destructive" />
      <Item label="Urgentes" value={urgentes} color="bg-yellow-500/10 text-yellow-600" />
      <Item label="Normais" value={normais} color="bg-green-500/10 text-green-600" />
    </div>
  );
};

export default KpiCardGrid;
