
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';

interface FuncionarioActionsMenuProps {
  funcionario: PlanoFuncionario;
  planoId: string;
  tipoSeguro: string;
  cnpjId: string;
  onViewDetails: (funcionario: PlanoFuncionario) => void;
}

export const FuncionarioActionsMenu: React.FC<FuncionarioActionsMenuProps> = ({
  funcionario,
  planoId,
  tipoSeguro,
  cnpjId,
  onViewDetails
}) => {
  const { updateFuncionario, deleteFuncionario } = usePlanoFuncionarios({
    planoId,
    tipoSeguro,
    statusFilter: undefined,
    search: undefined,
    pageIndex: 0,
    pageSize: 10,
  });

  const handleStatusChange = (newStatus: 'ativo' | 'inativo' | 'exclusao_solicitada') => {
    updateFuncionario.mutate({
      funcionario_id: funcionario.funcionario_id,
      status: newStatus
    });
  };

  const handleRemove = () => {
    if (window.confirm('Tem certeza que deseja remover este funcionário do plano?')) {
      deleteFuncionario.mutate(funcionario.funcionario_id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onViewDetails(funcionario)}>
          <Eye className="mr-2 h-4 w-4" />
          Ver detalhes
        </DropdownMenuItem>
        
        {funcionario.status === 'pendente' && (
          <DropdownMenuItem onClick={() => handleStatusChange('ativo')}>
            <Edit className="mr-2 h-4 w-4" />
            Ativar
          </DropdownMenuItem>
        )}
        
        {funcionario.status === 'ativo' && (
          <DropdownMenuItem onClick={() => handleStatusChange('inativo')}>
            <Edit className="mr-2 h-4 w-4" />
            Desativar
          </DropdownMenuItem>
        )}
        
        {funcionario.status === 'ativo' && (
          <DropdownMenuItem onClick={() => handleStatusChange('exclusao_solicitada')}>
            <Trash2 className="mr-2 h-4 w-4" />
            Solicitar exclusão
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={handleRemove} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Remover do plano
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
