
import React from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, AlertTriangle } from 'lucide-react';
import { useResolverExclusao } from '@/hooks/useResolverExclusao';
import { Tables } from '@/integrations/supabase/types';

type Funcionario = Tables<'funcionarios'>;

interface FuncionariosTableActionsProps {
  funcionario: Funcionario;
  onApproveExclusao?: (id: string) => void;
  onDenyExclusao?: (id: string) => void;
}

const FuncionariosTableActions = ({ 
  funcionario, 
  onApproveExclusao, 
  onDenyExclusao 
}: FuncionariosTableActionsProps) => {
  const resolverExclusao = useResolverExclusao();

  const handleApprove = () => {
    if (confirm('Tem certeza que deseja APROVAR a exclusão deste funcionário? Esta ação não pode ser desfeita.')) {
      resolverExclusao.mutate({
        funcionarioId: funcionario.id,
        acao: 'aprovar'
      });
    }
  };

  const handleDeny = () => {
    if (confirm('Tem certeza que deseja NEGAR a exclusão deste funcionário? Ele será reativado.')) {
      resolverExclusao.mutate({
        funcionarioId: funcionario.id,
        acao: 'negar'
      });
    }
  };

  // Só mostrar ações para funcionários com exclusão solicitada
  if (funcionario.status !== 'exclusao_solicitada') {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="destructive"
        size="sm"
        onClick={handleApprove}
        disabled={resolverExclusao.isPending}
        className="gap-2"
      >
        <Check className="h-4 w-4" />
        Aprovar Exclusão
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleDeny}
        disabled={resolverExclusao.isPending}
        className="gap-2"
      >
        <X className="h-4 w-4" />
        Negar Exclusão
      </Button>
    </div>
  );
};

export default FuncionariosTableActions;
