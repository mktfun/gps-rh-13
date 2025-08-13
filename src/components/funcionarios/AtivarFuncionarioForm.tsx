import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, User, AlertTriangle } from 'lucide-react';

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

  const ativarFuncionario = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('funcionarios')
        .update({
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .eq('id', funcionario.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Funcionário ativado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ativar-funcionario'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      onSuccess?.();
    },
    onError: (error) => {
      console.error('Erro ao ativar funcionário:', error);
      toast.error('Erro ao ativar funcionário');
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
                <span className="font-medium text-gray-600">Nome:</span>
                <span className="ml-2 text-gray-900">{funcionario.nome}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">CPF:</span>
                <span className="ml-2 text-gray-900">{formatCPF(funcionario.cpf)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cargo:</span>
                <span className="ml-2 text-gray-900">{funcionario.cargo}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Idade:</span>
                <span className="ml-2 text-gray-900">{funcionario.idade} anos</span>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-600">Salário:</span>
                <span className="ml-2 text-gray-900">{formatCurrency(funcionario.salario)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Estado Civil:</span>
                <span className="ml-2 text-gray-900 capitalize">{funcionario.estado_civil}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{funcionario.email || 'Não informado'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Empresa:</span>
                <span className="ml-2 text-gray-900">{funcionario.cnpj.empresa.nome}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aviso sobre adição ao plano */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 mb-2">
                Sobre a Adição aos Planos de Seguro
              </h4>
              <p className="text-sm text-amber-800">
                Ativar um funcionário apenas muda seu status para "ativo". Para incluí-lo em planos de seguro, 
                será necessário adicioná-lo manualmente na tela de detalhes do plano usando a função de seleção de funcionários.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Ativação */}
      <div className="pt-4">
        <Button 
          onClick={handleActivate}
          className="w-full"
          disabled={ativarFuncionario.isPending}
          size="lg"
        >
          <Shield className="h-4 w-4 mr-2" />
          {ativarFuncionario.isPending ? 'Ativando Funcionário...' : 'Ativar Funcionário'}
        </Button>
      </div>
    </div>
  );
};
