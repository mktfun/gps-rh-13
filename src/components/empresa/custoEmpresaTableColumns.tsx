import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface CustoEmpresa {
  cnpj_razao_social: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  valor_individual: number;
  status: string;
  total_cnpj: number;
}

export const createCustoEmpresaTableColumns = (): ColumnDef<CustoEmpresa>[] => [
  {
    accessorKey: 'cnpj_razao_social',
    header: 'CNPJ/Razão Social',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('cnpj_razao_social')}</div>
    ),
  },
  {
    accessorKey: 'funcionario_nome',
    header: 'Funcionário',
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.getValue('funcionario_nome')}</div>
        <div className="text-xs text-muted-foreground">{row.original.funcionario_cpf}</div>
      </div>
    ),
  },
  {
    accessorKey: 'valor_individual',
    header: 'Valor Individual',
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(row.getValue('valor_individual'))}
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const getStatusVariant = (status: string) => {
        switch (status) {
          case 'ativo':
            return 'default';
          case 'pendente':
            return 'secondary';
          case 'desativado':
            return 'destructive';
          default:
            return 'outline';
        }
      };

      return (
        <Badge variant={getStatusVariant(status)}>
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'total_cnpj',
    header: 'Total CNPJ',
    cell: ({ row }) => (
      <div className="text-right font-semibold">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(row.getValue('total_cnpj'))}
      </div>
    ),
  },
];
