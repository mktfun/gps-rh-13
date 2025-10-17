
import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { FuncionarioDetalhesModal } from './FuncionarioDetalhesModal';
import { FuncionarioActionsMenu } from './FuncionarioActionsMenu';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';

interface FuncionariosPlanoDataTableProps {
  funcionarios: PlanoFuncionario[];
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  pagination: { pageIndex: number; pageSize: number };
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  search: string;
  setSearch: (search: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  plano: {
    id: string;
    tipoSeguro: string;
    seguradora: string;
    valor_mensal: number;
    cnpj_id: string;
  };
}

export const FuncionariosPlanoDataTable: React.FC<FuncionariosPlanoDataTableProps> = ({
  funcionarios,
  isLoading,
  totalCount,
  totalPages,
  pagination,
  setPagination,
  plano,
}) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);
  const [funcionarioModalOpen, setFuncionarioModalOpen] = useState(false);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'pendente':
        return 'secondary';
      case 'exclusao_solicitada':
        return 'destructive';
      case 'edicao_solicitada':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'pendente':
        return 'Pendente';
      case 'exclusao_solicitada':
        return 'Exclusão Solicitada';
      case 'edicao_solicitada':
        return 'Edição Solicitada';
      case 'desativado':
        return 'Desativado';
      default:
        return status;
    }
  };

  const handleViewDetails = (funcionario: PlanoFuncionario) => {
    setSelectedFuncionario({
      ...funcionario,
      cnpj_razao_social: 'Razão Social da Empresa',
      cnpj_numero: '00.000.000/0001-00',
      plano_seguradora: plano.seguradora,
      plano_valor_mensal: plano.valor_mensal,
      plano_cobertura_morte: 50000
    });
    setFuncionarioModalOpen(true);
  };

  const columns: ColumnDef<PlanoFuncionario>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('nome')}</div>
      ),
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('cpf')}</div>
      ),
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('cargo')}</div>
      ),
    },
    {
      accessorKey: 'idade',
      header: 'Idade',
      cell: ({ row }) => (
        <div className="text-sm">{row.getValue('idade')} anos</div>
      ),
    },
    {
      accessorKey: 'salario',
      header: 'Salário',
      cell: ({ row }) => {
        const salario = row.getValue('salario') as number;
        return (
          <div className="font-medium">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(salario)}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={getStatusVariant(status)} className="font-medium">
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const funcionario = row.original;
        
        return (
          <FuncionarioActionsMenu 
            funcionario={funcionario}
            planoId={plano.id}
            tipoSeguro={plano.tipoSeguro}
            cnpjId={plano.cnpj_id}
            onViewDetails={handleViewDetails}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={funcionarios}
        isLoading={isLoading}
        pagination={pagination}
        setPagination={setPagination}
        totalPages={totalPages}
        emptyStateTitle="Nenhum funcionário encontrado"
        emptyStateDescription="Não há funcionários vinculados a este plano ou nenhum resultado foi encontrado com os filtros aplicados."
      />

      {/* Modal de Detalhes do Funcionário */}
      <FuncionarioDetalhesModal
        funcionario={selectedFuncionario}
        open={funcionarioModalOpen}
        onOpenChange={setFuncionarioModalOpen}
      />
    </>
  );
};
