import React from 'react';
import { MoreHorizontal, Edit, Trash2, Users, Eye } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { useNavigate } from 'react-router-dom';
import { CnpjComPlano } from '@/hooks/useCnpjsComPlanos';

interface CNPJsListViewProps {
  cnpjs: CnpjComPlano[];
  onEdit: (cnpj: CnpjComPlano) => void;
  onDelete: (cnpjId: string) => void;
}

export const CNPJsListView: React.FC<CNPJsListViewProps> = ({ cnpjs, onEdit, onDelete }) => {
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'configuracao':
        return 'secondary';
      case 'inativo':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'configuracao':
        return 'Em Configuração';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleViewFuncionarios = (cnpj: CnpjComPlano) => {
    navigate(`/empresa/funcionarios?cnpj=${cnpj.id}`);
  };

  const handleDelete = (cnpj: CnpjComPlano) => {
    // TODO: Implementar confirmação e exclusão
    console.log('Excluir CNPJ:', cnpj.id);
  };

  const columns: ColumnDef<CnpjComPlano>[] = [
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {formatCNPJ(row.getValue('cnpj'))}
        </div>
      ),
    },
    {
      accessorKey: 'razao_social',
      header: 'Razão Social',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('razao_social')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusColor(row.getValue('status'))}>
          {getStatusLabel(row.getValue('status'))}
        </Badge>
      ),
    },
    {
      accessorKey: 'funcionariosAtivos',
      header: 'Funcionários',
      cell: ({ row }) => {
        const cnpj = row.original;
        return (
          <div className="text-sm">
            <div className="font-medium">{cnpj.funcionariosAtivos} ativos</div>
            {cnpj.funcionariosPendentes > 0 && (
              <div className="text-orange-600">{cnpj.funcionariosPendentes} pendentes</div>
            )}
            <div className="text-muted-foreground">{cnpj.totalFuncionarios} total</div>
          </div>
        );
      },
    },
    {
      accessorKey: 'temPlano',
      header: 'Plano',
      cell: ({ row }) => {
        const cnpj = row.original;
        return (
          <div className="space-y-1">
            <Badge variant={cnpj.temPlano ? 'default' : 'secondary'}>
              {cnpj.temPlano ? 'Com Plano' : 'Sem Plano'}
            </Badge>
            {cnpj.temPlano && cnpj.valor_mensal && (
              <div className="text-sm text-green-600 font-medium">
                {formatCurrency(cnpj.valor_mensal)}
              </div>
            )}
            {cnpj.seguradora && (
              <div className="text-xs text-muted-foreground">
                {cnpj.seguradora}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'totalPendencias',
      header: 'Pendências',
      cell: ({ row }) => {
        const pendencias = row.getValue('totalPendencias') as number;
        if (pendencias === 0) {
          return <span className="text-green-600 text-sm">Em dia</span>;
        }
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            {pendencias} pendência{pendencias > 1 ? 's' : ''}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const cnpj = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => handleViewFuncionarios(cnpj)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                Ver Funcionários
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit(cnpj)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(cnpj)}
                className="cursor-pointer text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={cnpjs}
      isLoading={false}
      emptyStateTitle="Nenhum CNPJ encontrado"
      emptyStateDescription="Não há CNPJs que correspondem aos critérios de busca."
    />
  );
};
