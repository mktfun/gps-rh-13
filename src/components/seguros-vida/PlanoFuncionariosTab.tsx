
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, UserCheck, UserX, Users, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { useFuncionariosMutation } from '@/hooks/useFuncionariosMutation';
import { Database } from '@/integrations/supabase/types';
import { ColumnDef } from '@tanstack/react-table';
import FuncionarioModal from '@/components/funcionarios/FuncionarioModal';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BulkImportModal } from '@/components/import/BulkImportModal';

type FuncionarioStatus = Database['public']['Enums']['funcionario_status'];

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
}

interface PlanoFuncionariosTabProps {
  cnpjId: string;
  plano: PlanoDetalhes;
  shouldOpenAddModal?: boolean;
  onAddModalHandled?: () => void;
}

export const PlanoFuncionariosTab: React.FC<PlanoFuncionariosTabProps> = ({ 
  cnpjId, 
  plano, 
  shouldOpenAddModal = false,
  onAddModalHandled 
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [editingFuncionario, setEditingFuncionario] = useState<any | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([]);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const queryClient = useQueryClient();

  // Hook para mutações de funcionários
  const { createFuncionario, isCreating } = useFuncionariosMutation(cnpjId);

  // Efeito para abrir modal de adicionar funcionário quando solicitado
  useEffect(() => {
    if (shouldOpenAddModal) {
      setIsAddModalOpen(true);
      onAddModalHandled?.();
    }
  }, [shouldOpenAddModal, onAddModalHandled]);

  const { 
    data, 
    isLoading, 
    updateFuncionario, 
    deleteFuncionario 
  } = usePlanoFuncionarios({
    cnpjId,
    search,
    statusFilter,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize
  });

  const funcionarios = data?.funcionarios || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  // Funcionários pendentes para ativação em massa (apenas status 'pendente')
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');

  const ativacaoMassaMutation = useMutation({
    mutationFn: async (funcionarioIds: string[]) => {
      const promises = funcionarioIds.map(id => 
        supabase
          .from('funcionarios')
          .update({ status: 'ativo' })
          .eq('id', id)
      );
      
      const results = await Promise.all(promises);
      
      // Verificar se houve erros
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao ativar ${errors.length} funcionário(s)`);
      }
      
      return results;
    },
    onSuccess: (_, funcionarioIds) => {
      toast.success(`${funcionarioIds.length} funcionário(s) ativado(s) com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId] });
      setSelectedFuncionarios([]);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao ativar funcionários');
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleStatusChange = async (funcionarioId: string, novoStatus: FuncionarioStatus) => {
    try {
      await updateFuncionario.mutateAsync({ id: funcionarioId, status: novoStatus });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleRemoverFuncionario = async (funcionarioId: string) => {
    try {
      await deleteFuncionario.mutateAsync(funcionarioId);
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
    }
  };

  const handleEditFuncionario = (funcionario: any) => {
    setEditingFuncionario(funcionario);
  };

  const handleFuncionarioSubmit = async (data: any) => {
    try {
      if (editingFuncionario) {
        // Editar funcionário existente
        await updateFuncionario.mutateAsync({ id: editingFuncionario.id, ...data });
        setEditingFuncionario(null);
      } else {
        // Criar novo funcionário
        await createFuncionario.mutateAsync({
          ...data,
          cnpj_id: cnpjId
        });
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
    }
  };

  const handleAtivacaoMassa = () => {
    if (funcionariosPendentes.length === 0) {
      toast.error('Não há funcionários pendentes para ativar');
      return;
    }

    const funcionarioIds = funcionariosPendentes.map(f => f.id);
    ativacaoMassaMutation.mutate(funcionarioIds);
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.nome}</div>
          <div className="text-sm text-muted-foreground">{row.original.cpf}</div>
        </div>
      ),
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
    },
    {
      accessorKey: 'idade',
      header: 'Idade',
      cell: ({ row }) => <span>{row.original.idade} anos</span>,
    },
    {
      accessorKey: 'salario',
      header: 'Salário',
      cell: ({ row }) => formatCurrency(row.original.salario),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status;
        const variant = status === 'ativo' ? 'default' : 
                      status === 'pendente' ? 'secondary' : 
                      status === 'exclusao_solicitada' ? 'destructive' : 
                      'outline';
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      id: 'custo-mensal',
      header: 'Custo Mensal',
      cell: () => (
        <span className="font-medium text-green-600">
          {formatCurrency(plano.valor_mensal)}
        </span>
      ),
    },
    {
      id: 'acoes',
      header: 'Ações',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <Edit className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleEditFuncionario(row.original)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(row.original.id, 'ativo')}
              disabled={row.original.status === 'ativo'}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Ativar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(row.original.id, 'desativado')}
              disabled={row.original.status === 'desativado'}
            >
              <UserX className="mr-2 h-4 w-4" />
              Desativar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleStatusChange(row.original.id, 'pendente')}
              disabled={row.original.status === 'pendente'}
            >
              <Filter className="mr-2 h-4 w-4" />
              Pendente
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover do Plano
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar remoção</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover {row.original.nome} do plano de seguro?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleRemoverFuncionario(row.original.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remover
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Funcionários do Plano</CardTitle>
          <CardDescription>
            Gerencie os funcionários vinculados ao plano de seguro de vida da {plano.seguradora}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendentes">Pendentes (Ativar/Excluir)</SelectItem>
                <SelectItem value="pendente">Aguardando Ativação</SelectItem>
                <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                <SelectItem value="desativado">Desativados</SelectItem>
              </SelectContent>
            </Select>

            {funcionariosPendentes.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="whitespace-nowrap">
                    <Users className="h-4 w-4 mr-2" />
                    Ativar em Massa ({funcionariosPendentes.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Ativar funcionários em massa</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja ativar {funcionariosPendentes.length} funcionário(s) pendente(s) de uma vez?
                      Esta ação irá alterar o status de todos os funcionários pendentes para "ativo".
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleAtivacaoMassa}
                      disabled={ativacaoMassaMutation.isPending}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      {ativacaoMassaMutation.isPending ? 'Ativando...' : 'Ativar Todos'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            <Button 
              variant="outline" 
              onClick={() => setIsBulkImportOpen(true)}
              className="whitespace-nowrap"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar em Massa
            </Button>

            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </div>

          {/* Tabela */}
          <DataTable
            columns={columns}
            data={funcionarios}
            isLoading={isLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            pagination={pagination}
            setPagination={setPagination}
          />
        </CardContent>
      </Card>

      {/* Modais existentes */}
      <FuncionarioModal
        isOpen={!!editingFuncionario}
        onClose={() => setEditingFuncionario(null)}
        funcionario={editingFuncionario}
        onSubmit={handleFuncionarioSubmit}
        isLoading={updateFuncionario.isPending}
      />

      <FuncionarioModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        funcionario={null}
        onSubmit={handleFuncionarioSubmit}
        isLoading={isCreating}
        empresaId={cnpjId}
      />

      {/* Novo Modal de Importação */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        cnpjId={cnpjId}
        plano={plano}
      />
    </div>
  );
};
