
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';
import { useAuth } from '@/hooks/useAuth';
import { useAtivarFuncionarioPlano } from '@/hooks/useAtivarFuncionarioPlano';

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
  const { role } = useAuth();
  const { updateFuncionario, deleteFuncionario } = usePlanoFuncionarios({
    planoId,
    tipoSeguro,
    statusFilter: undefined,
    search: undefined,
    pageIndex: 0,
    pageSize: 10,
  });
  const ativarFuncionario = useAtivarFuncionarioPlano();

  const isCorretora = role === 'corretora';
  const isEmpresa = role === 'empresa';

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

  const handleSolicitarExclusao = () => {
    if (window.confirm('Tem certeza que deseja solicitar a exclusão deste funcionário? A corretora precisará aprovar.')) {
      handleStatusChange('exclusao_solicitada');
    }
  };

  const handleAtivarPendente = () => {
    if (window.confirm('Tem certeza que deseja ativar este funcionário no plano?')) {
      ativarFuncionario.mutate({
        funcionarioId: funcionario.funcionario_id,
        planoId: planoId
      });
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
        
        {/* Ações para CORRETORA */}
        {isCorretora && (
          <>
            {funcionario.status === 'pendente' && (
              <DropdownMenuItem onClick={handleAtivarPendente}>
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
            
            {funcionario.status === 'exclusao_solicitada' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange('ativo')} className="text-green-600">
                  <Edit className="mr-2 h-4 w-4" />
                  Negar exclusão (Reativar)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRemove} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Aprovar exclusão
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuItem onClick={handleRemove} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir definitivamente
            </DropdownMenuItem>
          </>
        )}

        {/* Ações para EMPRESA */}
        {isEmpresa && funcionario.status === 'ativo' && (
          <DropdownMenuItem onClick={handleSolicitarExclusao} className="text-orange-600">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Solicitar exclusão
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
