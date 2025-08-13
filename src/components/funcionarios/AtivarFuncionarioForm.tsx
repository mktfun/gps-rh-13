import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  if (planos.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground mb-4">
          <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum plano disponível</p>
          <p className="text-sm">Configure um plano para este CNPJ primeiro</p>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plano_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plano de Seguro</FormLabel>
              <Select 
                onValueChange={(value) => {
                  field.onChange(value);
                  setPlanoSelecionado(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {planos.map((plano) => (
                    <SelectItem key={plano.id} value={plano.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{plano.seguradora}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(plano.valor_mensal)}/mês
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {planoDetalhes && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Detalhes do Plano</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Seguradora:</span>
                <Badge variant="secondary">{planoDetalhes.seguradora}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Valor Mensal:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(planoDetalhes.valor_mensal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cobertura Morte:</span>
                <span>{formatCurrency(planoDetalhes.cobertura_morte)}</span>
              </div>
              <div className="flex justify-between">
                <span>Morte Acidental:</span>
                <span>{formatCurrency(planoDetalhes.cobertura_morte_acidental)}</span>
              </div>
              <div className="flex justify-between">
                <span>Invalidez por Acidente:</span>
                <span>{formatCurrency(planoDetalhes.cobertura_invalidez_acidente)}</span>
              </div>
              <div className="flex justify-between">
                <span>Auxílio Funeral:</span>
                <span>{formatCurrency(planoDetalhes.cobertura_auxilio_funeral)}</span>
              </div>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full"
          disabled={ativarFuncionario.isPending}
        >
          {ativarFuncionario.isPending ? 'Ativando...' : 'Ativar Funcionário'}
        </Button>
      </form>
    </Form>
  );
};
