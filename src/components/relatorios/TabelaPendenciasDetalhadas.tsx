
import React from 'react';
import { PendenciaItem } from '@/hooks/usePendenciasDaCorretora';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, MessageCircle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useConcluirPendencia } from '@/hooks/useConcluirPendencia';

interface Props {
  pendencias: PendenciaItem[];
  onAbrirConversa: (p: PendenciaItem) => void;
}

const prioridadeBadge = (p: PendenciaItem) => {
  if (p.prioridade === 'critico') return <Badge className="bg-destructive/10 text-destructive">Crítico</Badge>;
  if (p.prioridade === 'urgente') return <Badge className="bg-yellow-500/10 text-yellow-600">Urgente</Badge>;
  return <Badge className="bg-green-500/10 text-green-600">Normal</Badge>;
};

const TabelaPendenciasDetalhadas: React.FC<Props> = ({ pendencias, onAbrirConversa }) => {
  const { mutate: concluirPendencia, isPending: isConcluindo } = useConcluirPendencia();
  
  const handleConcluir = (pendenciaId: string) => {
    if (confirm('Tem certeza que deseja marcar esta pendência como concluída?')) {
      concluirPendencia({ pendenciaId });
    }
  };

  return (
    <Card className="p-4 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Protocolo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Funcionário</TableHead>
            <TableHead>CNPJ / Empresa</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Data Criação</TableHead>
            <TableHead>Prazo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Dias em Aberto</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendencias.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-mono text-xs">{p.protocolo}</TableCell>
              <TableCell className="capitalize">{p.tipo || '-'}</TableCell>
              <TableCell>{p.funcionario_nome || '-'}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm">{p.cnpj_razao_social || '-'}</span>
                  <span className="text-xs text-muted-foreground">{p.empresa_nome || '-'}</span>
                </div>
              </TableCell>
              <TableCell className="max-w-[280px] truncate" title={p.descricao}>{p.descricao}</TableCell>
              <TableCell>{p.data_criacao ? new Date(p.data_criacao).toLocaleDateString() : '-'}</TableCell>
              <TableCell>{p.data_vencimento ? new Date(p.data_vencimento).toLocaleDateString() : '-'}</TableCell>
              <TableCell>{prioridadeBadge(p)}</TableCell>
              <TableCell className={cn('font-medium', p.dias_em_aberto && p.dias_em_aberto > 15 ? 'text-destructive' : '')}>
                {p.dias_em_aberto ?? 0}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button size="icon" variant="outline" onClick={() => console.log('Ver detalhes pendência', p.id)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={() => onAbrirConversa(p)}>
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => handleConcluir(p.id)}
                    disabled={isConcluindo}
                    className="text-green-600 border-green-600 hover:bg-green-50"
                    title="Marcar como concluída"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {pendencias.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">Nenhuma pendência encontrada.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
};

export default TabelaPendenciasDetalhadas;
