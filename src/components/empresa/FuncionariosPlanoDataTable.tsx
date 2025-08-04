import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Plus, Users, Search } from 'lucide-react';
import { FuncionarioDetalhesModal } from './FuncionarioDetalhesModal';
import { AdicionarFuncionarioModal } from './AdicionarFuncionarioModal';
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
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  plano,
}) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);
  const [funcionarioModalOpen, setFuncionarioModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);

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
            cnpjId={plano.cnpj_id}
            onViewDetails={handleViewDetails}
          />
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">Funcionários do Plano</h3>
          <p className="text-muted-foreground text-lg mt-1">
            Gerencie os funcionários vinculados ao plano {plano.seguradora}
          </p>
        </div>
        <Button 
          onClick={() => setAddModalOpen(true)}
          size="lg"
          className="text-base"
        >
          <Plus className="mr-3 h-5 w-5" />
          Adicionar Funcionário
        </Button>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funcionários ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 text-base">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                <SelectItem value="edicao_solicitada">Edição Solicitada</SelectItem>
                <SelectItem value="desativado">Desativado</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
        </CardContent>
      </Card>

      {/* Modais */}
      <FuncionarioDetalhesModal
        funcionario={selectedFuncionario}
        open={funcionarioModalOpen}
        onOpenChange={setFuncionarioModalOpen}
      />

      <AdicionarFuncionarioModal
        cnpjId={plano.cnpj_id}
        planoSeguradora={plano.seguradora}
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />
    </div>
  );
};
