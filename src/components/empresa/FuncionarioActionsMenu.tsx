
import React from 'react';
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { toast } from 'sonner';

interface FuncionarioActionsMenuProps {
  funcionario: {
    id: string;
    nome: string;
    status: string;
  };
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude' | 'outros';
  onEdit?: (funcionario: any) => void;
  onView?: (funcionario: any) => void;
}

export const FuncionarioActionsMenu: React.FC<FuncionarioActionsMenuProps> = ({
  funcionario,
  cnpjId,
  tipoSeguro,
  onEdit,
  onView
}) => {
  const { deleteFuncionario } = usePlanoFuncionarios({ cnpjId, tipoSeguro });

  const handleEdit = () => {
    if (onEdit) {
      onEdit(funcionario);
    } else {
      toast.info('Funcionalidade de edição em desenvolvimento');
    }
  };

  const handleView = () => {
    if (onView) {
      onView(funcionario);
    } else {
      toast.info('Funcionalidade de visualização em desenvolvimento');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir ${funcionario.nome}?`)) {
      try {
        await deleteFuncionario.mutateAsync(funcionario.id);
        toast.success('Funcionário excluído com sucesso!');
      } catch (error) {
        console.error('Erro ao excluir funcionário:', error);
        toast.error('Erro ao excluir funcionário');
      }
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
        <DropdownMenuItem onClick={handleView}>
          <Eye className="mr-2 h-4 w-4" />
          Visualizar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
