import React, { useState } from 'react';
import { Users, Plus, Search, Filter, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { DataTable } from '@/components/ui/data-table';
import { FuncionarioDetalhesModal } from '@/components/empresa/FuncionarioDetalhesModal';
import { createFuncionariosEmpresaTableColumns } from '@/components/empresa/funcionariosEmpresaTableColumns';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import FuncionarioModal from '@/components/funcionarios/FuncionarioModal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface FuncionarioEmpresa {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
  created_at: string;
  cnpj?: {
    razao_social: string;
    cnpj: string;
  };
  plano?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
  };
}

const Funcionarios = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [selectedFuncionario, setSelectedFuncionario] = useState<FuncionarioEmpresa | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  const { data: empresaId } = useEmpresaId();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const pageSize = 10;
  
  const {
    funcionarios,
    totalCount,
    totalPages,
    isLoading,
    archiveFuncionario,
    addFuncionario,
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

  const handleSolicitarExclusao = (funcionario: FuncionarioEmpresa) => {
    if (window.confirm(`Tem certeza que deseja solicitar a exclusão do funcionário "${funcionario.nome}"? A corretora precisará aprovar.`)) {
      archiveFuncionario.mutate(funcionario.id);
    }
  };

  // Mutation para ativar funcionário (corretora)
  const ativarFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const { error } = await supabase
        .from('funcionarios')
        .update({
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', funcionarioId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      toast.success('Funcionário ativado com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao ativar funcionário');
    },
  });

  // Mutation para excluir funcionário (corretora)
  const excluirFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const { data, error } = await supabase.rpc('resolver_exclusao_funcionario', {
        p_funcionario_id: funcionarioId,
        p_aprovado: true
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      toast.success('Funcionário excluído com sucesso!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erro ao excluir funcionário');
    },
  });

  const handleAtivarFuncionario = (funcionario: FuncionarioEmpresa) => {
    if (window.confirm(`Tem certeza que deseja ativar o funcionário "${funcionario.nome}"?`)) {
      ativarFuncionario.mutate(funcionario.id);
    }
  };

  const handleExcluirFuncionario = (funcionario: FuncionarioEmpresa) => {
    if (window.confirm(`Tem certeza que deseja excluir definitivamente o funcionário "${funcionario.nome}"? Esta ação não pode ser desfeita.`)) {
      excluirFuncionario.mutate(funcionario.id);
    }
  };

  const handleCreateFuncionario = async (data: any) => {
    try {
      await addFuncionario.mutateAsync(data);
      setCreateModalOpen(false);
      setCurrentPage(0); // Reset to first page to see the new employee
    } catch (error) {
      console.error('Erro ao criar funcionário:', error);
    }
  };

  const columns = createFuncionariosEmpresaTableColumns(handleViewDetails, handleSolicitarExclusao);

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(0);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(0);
  };

  const filteredFuncionarios = statusFilter === 'todos' 
    ? funcionarios
    : funcionarios?.filter(funcionario => funcionario.status === statusFilter) || [];

  const pagination = {
    pageIndex: currentPage,
    pageSize: pageSize,
  };

  const setPagination = (newPagination: { pageIndex: number; pageSize: number }) => {
    setCurrentPage(newPagination.pageIndex);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Gestão de Funcionários
              </h1>
              <p className="text-sm text-muted-foreground">
                Gerencie todos os funcionários da sua empresa
              </p>
            </div>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Funcionário
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Funcionários da Empresa ({totalCount})
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
                    <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
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
              emptyStateDescription="Clique em 'Adicionar Funcionário' para criar o primeiro funcionário da empresa."
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

      {/* Modal de criação */}
      <FuncionarioModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateFuncionario}
        isLoading={addFuncionario.isPending}
        empresaId={empresaId}
      />
    </div>
  );
};

export default Funcionarios;
