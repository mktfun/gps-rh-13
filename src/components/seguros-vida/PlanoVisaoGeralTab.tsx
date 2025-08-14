import React, { useState } from 'react';
import { Building2, Shield, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlanoInfoFormModal } from './PlanoInfoFormModal';
import { PlanoCoberturasFormModal } from './PlanoCoberturasFormModal';
import { PlanoAlertas } from './PlanoAlertas';
import { AcoesRapidas } from './AcoesRapidas';
import { IndicadoresFinanceiros } from './IndicadoresFinanceiros';
import { GestorPendencias } from './GestorPendencias';
import { ValoresVidaTable } from '@/components/planos/ValoresVidaTable';
import { usePlanosMutation } from '@/hooks/usePlanosMutation';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  tipo_seguro: 'vida' | 'saude' | 'outros';
}
interface FuncionarioPlano {
  id: string;
  nome: string;
  status: string;
  idade: number;
}
interface PlanoVisaoGeralTabProps {
  plano: PlanoDetalhes;
  funcionarios: FuncionarioPlano[];
  onNavigateToFuncionarios: () => void;
  onAddFuncionario: () => void;
}
export const PlanoVisaoGeralTab: React.FC<PlanoVisaoGeralTabProps> = ({
  plano,
  funcionarios,
  onNavigateToFuncionarios,
  onAddFuncionario
}) => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isCoberturasModalOpen, setIsCoberturasModalOpen] = useState(false);
  const {
    updatePlano
  } = usePlanosMutation();
  const queryClient = useQueryClient();
  const ativacaoMassaMutation = useMutation({
    mutationFn: async (funcionarioIds: string[]) => {
      const promises = funcionarioIds.map(id => supabase.from('funcionarios').update({
        status: 'ativo'
      }).eq('id', id));
      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Erro ao ativar ${errors.length} funcionário(s)`);
      }
      return results;
    },
    onSuccess: (_, funcionarioIds) => {
      toast.success(`${funcionarioIds.length} funcionário(s) ativado(s) com sucesso!`);
      queryClient.invalidateQueries({
        queryKey: ['plano-detalhes']
      });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao ativar funcionários');
    }
  });
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');
  const receitaMensalTotal = plano.valor_mensal * funcionarios.length;
  const coberturaTotalMorte = plano.cobertura_morte * funcionarios.length;
  const handleInfoSubmit = async (data: any) => {
    try {
      await updatePlano.mutateAsync({
        plano_id: plano.id,
        cnpj_id: plano.cnpj_id,
        seguradora: data.seguradora,
        valor_mensal: data.valor_mensal,
        cobertura_morte: plano.cobertura_morte,
        cobertura_morte_acidental: plano.cobertura_morte_acidental,
        cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral,
        tipo_seguro: plano.tipo_seguro || 'vida'
      });
      setIsInfoModalOpen(false);
      toast.success('Informações do plano atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar informações do plano');
    }
  };
  const handleCoberturasSubmit = async (data: any) => {
    try {
      await updatePlano.mutateAsync({
        plano_id: plano.id,
        cnpj_id: plano.cnpj_id,
        seguradora: plano.seguradora,
        valor_mensal: plano.valor_mensal,
        cobertura_morte: data.cobertura_morte,
        cobertura_morte_acidental: data.cobertura_morte_acidental,
        cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
        tipo_seguro: plano.tipo_seguro || 'vida'
      });
      setIsCoberturasModalOpen(false);
      toast.success('Coberturas do plano atualizadas com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar coberturas do plano');
    }
  };
  const handleAtivarPendentes = () => {
    if (funcionariosPendentes.length === 0) {
      toast.error('Não há funcionários pendentes para ativar');
      return;
    }
    const funcionarioIds = funcionariosPendentes.map(f => f.id);
    ativacaoMassaMutation.mutate(funcionarioIds);
  };
  const handleAtivarFuncionario = async (funcionarioId: string) => {
    try {
      await supabase.from('funcionarios').update({
        status: 'ativo'
      }).eq('id', funcionarioId);
      toast.success('Funcionário ativado com sucesso!');
      queryClient.invalidateQueries({
        queryKey: ['plano-detalhes']
      });
    } catch (error) {
      toast.error('Erro ao ativar funcionário');
    }
  };
  const handleProcessarExclusao = (funcionarioId: string) => {
    // Navegar para a aba de funcionários com foco no funcionário específico
    onNavigateToFuncionarios();
    toast.info('Navegando para a aba de funcionários para processar a exclusão');
  };
  const handleGerarRelatorio = () => {
    toast.info('Funcionalidade de relatório em desenvolvimento');
  };
  return <div className="space-y-6">
      {/* Alertas Críticos */}
      <PlanoAlertas funcionarios={funcionarios} plano={plano} />

      {/* Ações Rápidas */}
      <AcoesRapidas funcionarios={funcionarios} plano={plano} onAtivarPendentes={handleAtivarPendentes} onGerarRelatorio={handleGerarRelatorio} onEditarPlano={() => setIsInfoModalOpen(true)} onAdicionarFuncionario={onAddFuncionario} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Indicadores Financeiros */}
        <IndicadoresFinanceiros funcionarios={funcionarios} plano={plano} />

        {/* Gestor de Pendências */}
        <GestorPendencias funcionarios={funcionarios} onAtivarFuncionario={handleAtivarFuncionario} onProcessarExclusao={handleProcessarExclusao} onNavigateToFuncionarios={onNavigateToFuncionarios} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                <p className="text-sm">{plano.empresa_nome}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                <p className="text-sm">{plano.cnpj_razao_social}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
                <Badge variant="secondary">{plano.seguradora}</Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tipo de Seguro</label>
                <Badge variant="outline">
                  {plano.tipo_seguro === 'vida' ? 'Vida' : plano.tipo_seguro === 'saude' ? 'Saúde' : 'Outros'}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Valor por Funcionário</label>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-semibold text-green-600">
                    {formatCurrency(plano.valor_mensal)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => setIsInfoModalOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Editar Informações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Coberturas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Coberturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Morte Natural</span>
                <span className="font-medium">{formatCurrency(plano.cobertura_morte)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Morte Acidental</span>
                <span className="font-medium">{formatCurrency(plano.cobertura_morte_acidental)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Invalidez por Acidente</span>
                <span className="font-medium">{formatCurrency(plano.cobertura_invalidez_acidente)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Auxílio Funeral</span>
                <span className="font-medium">{formatCurrency(plano.cobertura_auxilio_funeral)}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => setIsCoberturasModalOpen(true)}>
                <Shield className="h-4 w-4 mr-2" />
                Editar Coberturas
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Estatístico */}
      

      {/* Modais */}
      <PlanoInfoFormModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} plano={plano} onSubmit={handleInfoSubmit} isLoading={updatePlano.isPending} />

      <PlanoCoberturasFormModal isOpen={isCoberturasModalOpen} onClose={() => setIsCoberturasModalOpen(false)} plano={plano} onSubmit={handleCoberturasSubmit} isLoading={updatePlano.isPending} />
    </div>;
};
