
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';

interface TabelaDetalhada {
  id: string;
  nome_completo: string;
  cpf: string;
  cnpj: string;
  razao_social: string;
  status: string;
  data_admissao: string;
  data_ativacao_seguro: string;
  valor_individual: number;
  total_dependentes: number;
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

const formatCPF = (cpf: string) => {
  // Mascarar CPF: ***.***.***-XX
  if (!cpf || cpf.length < 11) return cpf;
  const digits = cpf.replace(/\D/g, '');
  return `***.***.***-${digits.slice(-2)}`;
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, any> = {
    'ativo': { variant: 'success', label: 'Ativo' },
    'pendente': { variant: 'warning', label: 'Pendente' },
    'desativado': { variant: 'destructive', label: 'Desativado' },
    'exclusao_solicitada': { variant: 'secondary', label: 'Exclusão Solicitada' },
    'arquivado': { variant: 'outline', label: 'Arquivado' }
  };

  const config = variants[status] || { variant: 'outline', label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const createFuncionariosDetailedTableColumns = (): ColumnDef<TabelaDetalhada>[] => [
  {
    accessorKey: 'nome_completo',
    header: 'Nome Completo',
    cell: ({ row }) => {
      return (
        <div>
          <div className="font-medium">{row.getValue('nome_completo')}</div>
          <div className="text-xs text-muted-foreground">
            {formatCPF(row.original.cpf)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'razao_social',
    header: 'CNPJ / Empresa',
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
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      return getStatusBadge(row.getValue('status'));
    },
  },
  {
    accessorKey: 'data_admissao',
    header: 'Data Admissão',
    cell: ({ row }) => {
      return (
        <div className="text-sm">
          {formatDate(row.getValue('data_admissao'))}
        </div>
      );
    },
  },
  {
    accessorKey: 'data_ativacao_seguro',
    header: 'Ativação Seguro',
    cell: ({ row }) => {
      const date = row.getValue('data_ativacao_seguro') as string;
      return (
        <div className="text-sm">
          {date ? formatDate(date) : 'Não ativado'}
        </div>
      );
    },
  },
  {
    accessorKey: 'valor_individual',
    header: 'Valor Individual',
    cell: ({ row }) => {
      const value = row.getValue('valor_individual') as number;
      return (
        <div className="font-medium text-green-600">
          {value > 0 ? formatCurrency(value) : 'N/A'}
        </div>
      );
    },
  },
  {
    accessorKey: 'total_dependentes',
    header: 'Dependentes',
    cell: ({ row }) => {
      const total = row.getValue('total_dependentes') as number;
      return (
        <div className="text-center">
          <div className="font-medium">{total}</div>
          <div className="text-xs text-muted-foreground">dependentes</div>
        </div>
      );
    },
  },
];
