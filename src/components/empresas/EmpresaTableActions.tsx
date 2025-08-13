
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

  return (
    <div className="flex items-center justify-end gap-2">
      {/* Botão de Editar */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(empresa)}
        className="hover:bg-primary/10 transition-colors"
        title="Editar dados da empresa"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      
      {/* Botão de Excluir - Apenas corretoras podem excluir empresas */}
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
              {deletingId === empresa.id ? (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                </div>
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <p>
                  Tem certeza que deseja excluir a empresa <strong>"{empresa.nome}"</strong>?
                </p>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    ⚠️ Esta ação é irreversível!
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Todos os dados relacionados serão removidos permanentemente:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 ml-4 list-disc">
                    <li>CNPJs cadastrados ({empresa.total_funcionarios > 0 ? 'com funcionários' : 'sem funcionários'})</li>
                    <li>Funcionários ativos ({empresa.total_funcionarios})</li>
                    <li>Planos de saúde e seguros</li>
                    <li>Histórico de movimentações</li>
                  </ul>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:bg-gray-100">
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteEmpresa}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={deletingId === empresa.id}
              >
                {deletingId === empresa.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    Excluindo...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Excluir Empresa
                  </div>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
