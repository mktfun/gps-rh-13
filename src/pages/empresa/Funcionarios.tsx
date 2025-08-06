
import React, { useState } from 'react';
import { Search, Users, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { DataTable } from '@/components/ui/data-table';
import { FuncionarioDetalhesModal } from '@/components/empresa/FuncionarioDetalhesModal';
import { createFuncionariosEmpresaTableColumns } from '@/components/empresa/funcionariosEmpresaTableColumns';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import Breadcrumbs from '@/components/ui/breadcrumbs';

interface FuncionarioEmpresa {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  created_at: string;
  cnpj_razao_social?: string;
  cnpj_numero?: string;
  plano_seguradora?: string;
  plano_valor_mensal?: number;
  plano_cobertura_morte?: number;
}

const Funcionarios = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioEmpresa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { data: empresaId } = useEmpresaId();
  const pageSize = 10;
  
  const {
    funcionarios,
    totalCount,
    totalPages,
    currentPage: realCurrentPage,
    isLoading,
  } = useFuncionarios({
    search,
    page: currentPage,
    pageSize,
    empresaId: empresaId || undefined,
    statusFilter: statusFilter === 'todos' ? undefined : statusFilter,
  });

  const handleViewDetails = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setModalOpen(true);
  };

  const columns = createFuncionariosEmpresaTableColumns(handleViewDetails);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  // Filtrar funcionários baseado no status (aplicado localmente para compatibilidade)
  const filteredFuncionarios = statusFilter === 'todos' 
    ? funcionarios
    : funcionarios?.filter(funcionario => funcionario.status === statusFilter) || [];

  const pagination = {
    pageIndex: currentPage,
    pageSize: pageSize,
  };

  const setPagination = (newPagination: { pageIndex: number; pageSize: number }) => {
    console.log('📄 [Funcionarios] Mudando página:', currentPage, '→', newPagination.pageIndex);
    setCurrentPage(newPagination.pageIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/empresa' },
          { label: 'Funcionários' }
        ]} />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Gestão de Funcionários
            </h1>
            <p className="text-sm text-muted-foreground">
              Visualize e gerencie os funcionários da sua empresa
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funcionários da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filtros e busca */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou CPF..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="desativado">Desativado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {totalCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  {totalCount} funcionário{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <DataTable
              columns={columns}
              data={filteredFuncionarios}
              isLoading={isLoading}
              totalCount={totalCount}
              totalPages={totalPages}
              pagination={pagination}
              setPagination={setPagination}
              emptyStateTitle="Nenhum funcionário encontrado"
              emptyStateDescription="Tente ajustar os filtros de busca ou adicione novos funcionários."
            />
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalhes */}
      <FuncionarioDetalhesModal
        funcionario={selectedFuncionario}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Funcionarios;
