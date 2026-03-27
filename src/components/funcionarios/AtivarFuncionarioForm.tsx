import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, User, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AtivarFuncionarioFormProps {
  funcionario: {
    id: string;
    nome: string;
    cpf: string;
    cargo: string;
    idade: number;
    estado_civil: string;
    salario: number;
    email?: string;
    cnpj_id: string;
    cnpj: {
      id: string;
      cnpj: string;
      razao_social: string;
      empresa: {
        id: string;
        nome: string;
      };
    };
  };
  planos: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
    cobertura_morte_acidental: number;
    cobertura_invalidez_acidente: number;
    cobertura_auxilio_funeral: number;
  }[];
  onSuccess?: () => void;
}

export const AtivarFuncionarioForm = ({
  funcionario,
  planos,
  onSuccess
}: AtivarFuncionarioFormProps) => {
  const queryClient = useQueryClient();
  const [selectedPlanoId, setSelectedPlanoId] = useState<string>(
    planos.length === 1 ? planos[0].id : ''
  );

  const ativarFuncionario = useMutation({
    mutationFn: async () => {
      if (!selectedPlanoId) throw new Error('Selecione um plano');

      const { data, error } = await supabase.rpc('ativar_funcionario_no_plano', {
        p_funcionario_id: funcionario.id,
        p_plano_id: selectedPlanoId,
      });

      if (error) throw error;

      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error || 'Erro ao ativar funcionário');
      }

      return result;
    },
    onSuccess: () => {
      toast.success('Funcionário ativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ativar-funcionario'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', selectedPlanoId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', selectedPlanoId] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Erro ao ativar funcionário:', error);
      toast.error(error.message || 'Erro ao ativar funcionário');
    },
  });

  const handleActivate = () => {
    ativarFuncionario.mutate();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  return (
    <div className="space-y-6">
      {/* Informações do Funcionário */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Funcionário
          </CardTitle>
          <CardDescription>
            Verifique os dados antes de ativar o funcionário
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-3">
              <div>
                <span className="font-medium text-muted-foreground">Nome:</span>
                <span className="ml-2 text-foreground">{funcionario.nome}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">CPF:</span>
                <span className="ml-2 text-foreground">{formatCPF(funcionario.cpf)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Cargo:</span>
                <span className="ml-2 text-foreground">{funcionario.cargo}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Idade:</span>
                <span className="ml-2 text-foreground">{funcionario.idade} anos</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-muted-foreground">Salário:</span>
                <span className="ml-2 text-foreground">{formatCurrency(funcionario.salario)}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Estado Civil:</span>
                <span className="ml-2 text-foreground capitalize">{funcionario.estado_civil}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Email:</span>
                <span className="ml-2 text-foreground">{funcionario.email || 'Não informado'}</span>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Empresa:</span>
                <span className="ml-2 text-foreground">{funcionario.cnpj.empresa.nome}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seleção de Plano */}
      {planos.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Selecionar Plano
            </CardTitle>
            <CardDescription>
              Selecione o plano de seguro para vincular o funcionário
            </CardDescription>
          </CardHeader>
          <CardContent>
            {planos.length === 1 ? (
              <div className="flex items-center gap-2 p-3 rounded-md bg-muted">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  {planos[0].seguradora} — {formatCurrency(planos[0].valor_mensal)}/mês
                </span>
              </div>
            ) : (
              <Select value={selectedPlanoId} onValueChange={setSelectedPlanoId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um plano..." />
                </SelectTrigger>
                <SelectContent>
                  {planos.map(plano => (
                    <SelectItem key={plano.id} value={plano.id}>
                      {plano.seguradora} — {formatCurrency(plano.valor_mensal)}/mês
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 mb-2">
                  Nenhum plano disponível
                </h4>
                <p className="text-sm text-amber-800">
                  Não há planos de seguro configurados para este CNPJ. Configure um plano antes de ativar o funcionário.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão de Ativação */}
      <div className="pt-4">
        <Button 
          onClick={handleActivate}
          className="w-full"
          disabled={ativarFuncionario.isPending || !selectedPlanoId || planos.length === 0}
          size="lg"
        >
          <Shield className="h-4 w-4 mr-2" />
          {ativarFuncionario.isPending ? 'Ativando Funcionário...' : 'Ativar Funcionário'}
        </Button>
      </div>
    </div>
  );
};
