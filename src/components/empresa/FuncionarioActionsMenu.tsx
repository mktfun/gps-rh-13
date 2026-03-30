
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Eye, Edit, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { PlanoFuncionario } from '@/hooks/usePlanoFuncionarios';
import { useAuth } from '@/hooks/useAuth';
import { useAtivarFuncionarioPlano } from '@/hooks/useAtivarFuncionarioPlano';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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
  const queryClient = useQueryClient();
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

  const handleAprovarExclusao = async () => {
    if (!window.confirm('Tem certeza que deseja aprovar a exclusão deste funcionário?')) return;

    try {
      // 1. Atualizar funcionário: status inativo + data_exclusao
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({
          status: 'desativado',
          data_exclusao: new Date().toISOString(),
          motivo_exclusao: 'Exclusão aprovada pela corretora'
        })
        .eq('id', funcionario.funcionario_id);

      if (updateError) throw updateError;

      // 2. Registrar no histórico
      const { error: historicoError } = await supabase
        .from('historico_funcionarios')
        .insert({
          funcionario_id: funcionario.funcionario_id,
          cnpj_id: funcionario.cnpj_id,
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          data_nascimento: funcionario.data_nascimento,
          cargo: funcionario.cargo,
          salario: funcionario.salario,
          email: funcionario.email || '',
          idade: funcionario.idade,
          estado_civil: 'solteiro',
          motivo_saida: 'Exclusão aprovada pela corretora',
          data_saida: new Date().toISOString()
        });

      if (historicoError) {
        console.warn('Erro ao registrar histórico (não crítico):', historicoError);
      }

      // 3. Remover vínculo do plano
      const { error: deleteError } = await supabase
        .from('planos_funcionarios')
        .delete()
        .match({
          plano_id: planoId,
          funcionario_id: funcionario.funcionario_id
        });

      if (deleteError) throw deleteError;

      toast.success('Exclusão aprovada com sucesso');

      // 4. Invalidar todas as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['relatorioMovimentacao'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-empresa'] });
    } catch (error: any) {
      console.error('Erro ao aprovar exclusão:', error);
      toast.error(error?.message || 'Erro ao aprovar exclusão');
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Tem certeza que deseja excluir definitivamente este funcionário do plano?')) return;

    try {
      // 1. Atualizar funcionário
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({
          status: 'desativado',
          data_exclusao: new Date().toISOString(),
          motivo_exclusao: 'Exclusão direta pela corretora'
        })
        .eq('id', funcionario.funcionario_id);

      if (updateError) throw updateError;

      // 2. Registrar no histórico
      await supabase
        .from('historico_funcionarios')
        .insert({
          funcionario_id: funcionario.funcionario_id,
          cnpj_id: funcionario.cnpj_id,
          nome: funcionario.nome,
          cpf: funcionario.cpf,
          data_nascimento: funcionario.data_nascimento,
          cargo: funcionario.cargo,
          salario: funcionario.salario,
          email: funcionario.email || '',
          idade: funcionario.idade,
          estado_civil: 'solteiro',
          motivo_saida: 'Exclusão direta pela corretora',
          data_saida: new Date().toISOString()
        });

      // 3. Remover vínculo
      const { error: deleteError } = await supabase
        .from('planos_funcionarios')
        .delete()
        .match({
          plano_id: planoId,
          funcionario_id: funcionario.funcionario_id
        });

      if (deleteError) throw deleteError;

      toast.success('Funcionário excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
    } catch (error: any) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error(error?.message || 'Erro ao excluir funcionário');
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
                <CheckCircle className="mr-2 h-4 w-4" />
                Ativar
              </DropdownMenuItem>
            )}
            
            {funcionario.status === 'ativo' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange('inativo')}>
                  <Edit className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleRemove} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir definitivamente
                </DropdownMenuItem>
              </>
            )}
            
            {funcionario.status === 'exclusao_solicitada' && (
              <>
                <DropdownMenuItem onClick={() => handleStatusChange('ativo')} className="text-green-600">
                  <XCircle className="mr-2 h-4 w-4" />
                  Negar exclusão (Reativar)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleAprovarExclusao} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Aprovar exclusão
                </DropdownMenuItem>
              </>
            )}
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
