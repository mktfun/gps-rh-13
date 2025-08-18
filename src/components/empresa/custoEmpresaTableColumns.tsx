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
  tipo_plano?: string;
}

export const createCustoEmpresaTableColumns = (): ColumnDef<CustoEmpresa>[] => [
  {
    accessorKey: 'cnpj_razao_social',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          CNPJ/Razão Social
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('cnpj_razao_social')}</div>
    ),
  },
  {
    accessorKey: 'funcionario_nome',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Funcionário
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="space-y-1">
        <div className="font-medium">{row.getValue('funcionario_nome')}</div>
        <div className="text-xs text-muted-foreground">{row.original.funcionario_cpf}</div>
        {row.original.tipo_plano && row.original.tipo_plano !== 'sem_plano' && (
          <Badge variant="outline" className="text-xs">
            {row.original.tipo_plano === 'vida'
              ? 'Seguro de Vida'
              : row.original.tipo_plano === 'saude'
              ? 'Plano de Saúde'
              : row.original.tipo_plano === 'ambos'
              ? 'Vida + Saúde'
              : 'Tipo Desconhecido'}
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'valor_individual',
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Valor Individual
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
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
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Status
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
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
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
          className="h-auto p-0 hover:bg-transparent"
        >
          Total CNPJ
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      );
    },
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
