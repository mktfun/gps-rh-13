
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { EmpresaComMetricas } from '@/hooks/useEmpresas';

interface EmpresaTableActionsProps {
  empresa: EmpresaComMetricas;
  onEdit: (empresa: EmpresaComMetricas) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export const EmpresaTableActions = ({ 
  empresa, 
  onEdit, 
  onDelete,
  deletingId 
}: EmpresaTableActionsProps) => {
  const { user } = useAuth();
  const isCorretora = user?.user_metadata?.role === 'corretora';

  const handleDeleteEmpresa = async () => {
    try {
      await onDelete(empresa.id);
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
    }
  };

  const getPendenciasBadge = () => {
    const totalPendencias = empresa?.total_pendencias || 0;
    
    if (totalPendencias === 0) {
      return (
        <span className="text-muted-foreground">0</span>
      );
    }
    
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        {totalPendencias}
      </Badge>
    );
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Badge de pendências */}
      <div className="text-center">
        {getPendenciasBadge()}
      </div>

      {/* Ações disponíveis */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(empresa)}
        className="hover:bg-primary/10 transition-colors"
        title="Editar dados da empresa"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      
      {/* Apenas corretoras podem excluir empresas */}
      {isCorretora && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-red-100 hover:text-red-600 transition-colors"
              title="Excluir empresa"
              disabled={deletingId === empresa.id}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <p>
                  Tem certeza que deseja excluir a empresa <strong>"{empresa.nome}"</strong>?
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ Esta ação é irreversível e irá remover todos os dados relacionados: CNPJs, funcionários e planos.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEmpresa}
                className="bg-red-600 hover:bg-red-700"
                disabled={deletingId === empresa.id}
              >
                {deletingId === empresa.id ? 'Excluindo...' : 'Excluir Empresa'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
