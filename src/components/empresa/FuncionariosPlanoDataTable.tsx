
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, UserCheck, Clock, AlertTriangle, X } from 'lucide-react';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';
import { FuncionarioActionsMenu } from './FuncionarioActionsMenu';
import { FuncionarioDetalhesModal } from './FuncionarioDetalhesModal';
import { useState } from 'react';

interface FuncionariosPlanoDataTableProps {
  data: PlanoFuncionario[];
  isLoading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onAtivarFuncionario: (funcionarioId: string) => Promise<void>;
  onRemoverFuncionario: (funcionarioId: string) => Promise<void>;
  isUpdating: boolean;
  tipoSeguro?: 'vida' | 'saude';
}

export const FuncionariosPlanoDataTable: React.FC<FuncionariosPlanoDataTableProps> = ({
  data,
  isLoading,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onAtivarFuncionario,
  onRemoverFuncionario,
  isUpdating,
  tipoSeguro = 'vida'
}) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState<PlanoFuncionario | null>(null);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);

  const totalPages = Math.ceil(totalCount / pageSize);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ativo':
        return <Badge variant="default" className="bg-green-100 text-green-800"><UserCheck className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'inativo':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800"><X className="w-3 h-3 mr-1" />Inativo</Badge>;
      case 'exclusao_solicitada':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" />Exclusão Solicitada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleViewDetails = (funcionario: PlanoFuncionario) => {
    setSelectedFuncionario(funcionario);
    setShowDetalhesModal(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: pageSize }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum funcionário encontrado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>CPF</TableHead>
            <TableHead>Cargo</TableHead>
            <TableHead>Idade</TableHead>
            <TableHead>Salário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((funcionario) => (
            <TableRow key={funcionario.id}>
              <TableCell className="font-medium">{funcionario.nome}</TableCell>
              <TableCell>{funcionario.cpf}</TableCell>
              <TableCell>{funcionario.cargo}</TableCell>
              <TableCell>{funcionario.idade} anos</TableCell>
              <TableCell>{formatCurrency(funcionario.salario)}</TableCell>
              <TableCell>{getStatusBadge(funcionario.status)}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {funcionario.status === 'pendente' && (
                    <Button
                      size="sm"
                      onClick={() => onAtivarFuncionario(funcionario.funcionario_id)}
                      disabled={isUpdating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="w-4 h-4 mr-1" />
                      Ativar
                    </Button>
                  )}
                  <FuncionarioActionsMenu
                    funcionario={funcionario}
                    cnpjId={funcionario.cnpj_id}
                    tipoSeguro={tipoSeguro}
                    onViewDetails={handleViewDetails}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Mostrando {(currentPage * pageSize) + 1} a {Math.min((currentPage + 1) * pageSize, totalCount)} de {totalCount} funcionários
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </Button>
          <span className="text-sm">
            Página {currentPage + 1} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedFuncionario && (
        <FuncionarioDetalhesModal
          funcionario={selectedFuncionario}
          open={showDetalhesModal}
          onOpenChange={setShowDetalhesModal}
        />
      )}
    </div>
  );
};
