
import { ColumnDef } from '@tanstack/react-table';

interface TabelaDetalhada {
  cnpj_id: string;
  cnpj: string;
  razao_social: string;
  seguradora: string;
  valor_mensal: number;
  funcionarios_ativos: number;
  custo_por_funcionario: number;
  data_inicio_plano: string;
  tipo_seguro: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const createCostsDetailedTableColumns = (): ColumnDef<TabelaDetalhada>[] => [
  {
    accessorKey: 'razao_social',
    header: 'Razão Social',
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue('razao_social')}</div>
          <div className="text-xs text-muted-foreground">{row.original.cnpj}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'seguradora',
    header: 'Seguradora',
    cell: ({ row }) => {
      return (
        <div>
          <div>{row.getValue('seguradora')}</div>
          <div className="text-xs text-muted-foreground capitalize">
            {row.original.tipo_seguro}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'valor_mensal',
    header: 'Valor do Plano',
    cell: ({ row }) => {
      return (
        <div className="font-medium text-green-600">
          {formatCurrency(row.getValue('valor_mensal'))}
        </div>
      );
    },
  },
  {
    accessorKey: 'funcionarios_ativos',
    header: 'Funcionários',
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <div className="font-medium">{row.getValue('funcionarios_ativos')}</div>
          <div className="text-xs text-muted-foreground">ativos</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'custo_por_funcionario',
    header: 'Custo/Funcionário',
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {formatCurrency(row.getValue('custo_por_funcionario'))}
        </div>
      );
    },
  },
  {
    accessorKey: 'data_inicio_plano',
    header: 'Início do Plano',
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {formatDate(row.getValue('data_inicio_plano'))}
        </div>
      );
    },
  },
];
