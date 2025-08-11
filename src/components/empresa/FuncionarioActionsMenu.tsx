
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { toast } from 'sonner';

interface FuncionarioActionsMenuProps {
  funcionario: PlanoFuncionario;
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude';
  onViewDetails: (funcionario: PlanoFuncionario) => void;
}

export const FuncionarioActionsMenu: React.FC<FuncionarioActionsMenuProps> = ({
  funcionario,
  cnpjId,
  tipoSeguro,
  onViewDetails,
}) => {
  const [showExclusaoDialog, setShowExclusaoDialog] = useState(false);
  const { updateFuncionario } = usePlanoFuncionarios({ cnpjId, tipoSeguro });

  const handleViewDetails = () => {
    onViewDetails(funcionario);
  };

  const handleSolicitarEdicao = () => {
    updateFuncionario.mutate({
      funcionario_id: funcionario.funcionario_id,
      status: 'exclusao_solicitada',
    }, {
      onSuccess: () => {
        toast.success('Solicitação de edição enviada para aprovação da corretora!');
      },
      onError: () => {
        toast.error('Erro ao enviar solicitação de edição');
      }
    });
  };

  const handleSolicitarExclusao = () => {
    setShowExclusaoDialog(true);
  };

  const handleConfirmExclusao = () => {
    updateFuncionario.mutate({
      funcionario_id: funcionario.funcionario_id,
      status: 'exclusao_solicitada',
    }, {
      onSuccess: () => {
        toast.success('Solicitação de exclusão enviada para aprovação da corretora!');
        setShowExclusaoDialog(false);
      },
      onError: () => {
        toast.error('Erro ao enviar solicitação de exclusão');
        setShowExclusaoDialog(false);
      }
    });
  };

  if (funcionario.status === 'exclusao_solicitada') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDetails}
        className="text-sm"
      >
        <Eye className="mr-2 h-4 w-4" />
        Ver Detalhes
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            Ver Detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSolicitarEdicao}>
            <Edit className="mr-2 h-4 w-4" />
            Solicitar Edição
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleSolicitarExclusao}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Solicitar Exclusão
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showExclusaoDialog} onOpenChange={setShowExclusaoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Solicitar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja solicitar a exclusão do funcionário <strong>{funcionario.nome}</strong>?
              Esta solicitação será enviada para a corretora para análise e aprovação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmExclusao}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Solicitação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
