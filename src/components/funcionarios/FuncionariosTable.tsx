import React, { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Archive, UserCheck, UserX, Shield, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DataTable } from '@/components/ui/data-table';
import FuncionarioModal from './FuncionarioModal';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useAuth } from '@/hooks/useAuth';
import { Tables } from '@/integrations/supabase/types';

type Funcionario = Tables<'funcionarios'> & {
  cnpj?: {
    razao_social: string;
    cnpj: string;
  };
};

interface FuncionariosTableProps {
  funcionarios: Funcionario[];
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'ativo':
      return <Badge variant="default">Ativo</Badge>;
    case 'pendente':
      return <Badge variant="secondary">Pendente</Badge>;
    case 'exclusao_solicitada':
      return <Badge variant="destructive">Exclusão Solicitada</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const formatCurrency = (value: number) => {
  // Value is already in reais, no need to divide by 100
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const FuncionariosTable = ({ 
  funcionarios, 
  isLoading, 
  totalCount, 
  totalPages, 
  pagination, 
  setPagination 
}: FuncionariosTableProps) => {
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const { archiveFuncionario, approveExclusao, denyExclusao, updateFuncionario } = useFuncionarios();

  // Adicionar mutation para ativar funcionário
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
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      toast({
        title: 'Sucesso',
        description: 'Funcionário ativado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao ativar funcionário',
        variant: 'destructive',
      });
    },
  });

  // Adicionar mutation para excluir definitivamente (corretora)
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
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      toast({
        title: 'Sucesso',
        description: 'Funcionário excluído com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir funcionário',
        variant: 'destructive',
      });
    },
  });

  const isCorretora = role === 'corretora';
  const isEmpresa = role === 'empresa';

  const handleEdit = (funcionario: Funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setModalOpen(true);
  };

  const handleSubmit = (data: any) => {
    if (funcionarioSelecionado) {
      updateFuncionario.mutate({
        id: funcionarioSelecionado.id,
        ...data
      });
    }
    setModalOpen(false);
    setFuncionarioSelecionado(null);
  };

  const handleArchive = (funcionarioId: string) => {
    if (window.confirm('Tem certeza que deseja solicitar a exclusão deste funcionário?')) {
      archiveFuncionario.mutate(funcionarioId);
    }
  };

  const handleApprove = (funcionarioId: string) => {
    if (window.confirm('Tem certeza que deseja aprovar a exclusão deste funcionário?')) {
      approveExclusao.mutate(funcionarioId);
    }
  };

  const handleDeny = (funcionarioId: string) => {
    if (window.confirm('Tem certeza que deseja negar a exclusão e reativar este funcionário?')) {
      denyExclusao.mutate(funcionarioId);
    }
  };

  const columns: ColumnDef<Funcionario>[] = [
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
        <div className="font-mono">{row.getValue('cpf')}</div>
      ),
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
    },
    {
      accessorKey: 'salario',
      header: 'Salário',
      cell: ({ row }) => {
        const salario = row.getValue('salario') as number;
        return <div className="font-medium">{formatCurrency(salario)}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return getStatusBadge(status);
      },
    },
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => {
        const cnpj = row.getValue('cnpj') as { razao_social: string; cnpj: string };
        return (
          <div className="max-w-[200px]">
            <div className="font-medium truncate">{cnpj?.razao_social}</div>
            <div className="text-sm text-muted-foreground font-mono">{cnpj?.cnpj}</div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const funcionario = row.original;
        const status = funcionario.status;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(funcionario)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              
              {/* Ações para EMPRESA */}
              {isEmpresa && status === 'ativo' && (
                <DropdownMenuItem onClick={() => handleArchive(funcionario.id)}>
                  <Archive className="mr-2 h-4 w-4" />
                  Solicitar Exclusão
                </DropdownMenuItem>
              )}
              
              {/* Ações para CORRETORA */}
              {isCorretora && status === 'exclusao_solicitada' && (
                <>
                  <DropdownMenuItem onClick={() => handleApprove(funcionario.id)}>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Aprovar Exclusão
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDeny(funcionario.id)}>
                    <UserX className="mr-2 h-4 w-4" />
                    Negar Exclusão
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
        totalCount={totalCount}
        totalPages={totalPages}
        pagination={pagination}
        setPagination={setPagination}
      />
      
      <FuncionarioModal
        funcionario={funcionarioSelecionado}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setFuncionarioSelecionado(null);
        }}
        onSubmit={handleSubmit}
        isLoading={updateFuncionario.isPending}
      />
    </>
  );
};
