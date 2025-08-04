
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, DollarSign } from 'lucide-react';

interface FuncionarioEmpresaRelatorio {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  status: string;
  cnpj_razao_social: string;
  data_contratacao: string;
}

export const createFuncionariosEmpresaRelatorioTableColumns = (): ColumnDef<FuncionarioEmpresaRelatorio>[] => [
  {
    accessorKey: 'nome',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <User className="h-4 w-4 mr-2" />
        Nome
      </Button>
    ),
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.getValue('nome')}</div>
        <div className="text-xs text-muted-foreground">{row.original.cpf}</div>
      </div>
    ),
  },
  {
    accessorKey: 'cargo',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Cargo
      </Button>
    ),
    cell: ({ row }) => row.getValue('cargo'),
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
    accessorKey: 'cnpj_razao_social',
    header: 'CNPJ',
    cell: ({ row }) => (
      <div className="text-sm">{row.original.cnpj_razao_social}</div>
    ),
  },
  {
    accessorKey: 'salario',
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        className="h-8 p-0 hover:bg-transparent"
      >
        <DollarSign className="h-4 w-4 mr-2" />
        Salário
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(row.getValue('salario'))}
      </div>
    ),
  },
  {
    accessorKey: 'data_contratacao',
    header: 'Data Contratação',
    cell: ({ row }) => {
      const date = new Date(row.getValue('data_contratacao'));
      return date.toLocaleDateString('pt-BR');
    },
  },
];
