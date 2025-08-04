
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dadosPlanoSchema, type DadosPlanoFormData } from '@/lib/schemas/dadosPlanoSchema';
import { usePlanosMutation } from '@/hooks/usePlanosMutation';
import { useCnpjsComPlanos } from '@/hooks/useCnpjsComPlanos';

interface PlanoFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plano?: any;
  preSelectedCnpjId?: string;
}

export const PlanoFormModal: React.FC<PlanoFormModalProps> = ({ 
  open, 
  onOpenChange, 
  plano,
  preSelectedCnpjId 
}) => {
  const { createPlano, updatePlano } = usePlanosMutation();
  const { data: cnpjs = [] } = useCnpjsComPlanos({ filtroPlano: 'sem-plano' });

  const form = useForm<DadosPlanoFormData>({
    resolver: zodResolver(dadosPlanoSchema),
    defaultValues: {
      seguradora: plano?.seguradora || '',
      valor_mensal: plano?.valor_mensal || 0,
      cobertura_morte: plano?.cobertura_morte || 0,
      cobertura_morte_acidental: plano?.cobertura_morte_acidental || 0,
      cobertura_invalidez_acidente: plano?.cobertura_invalidez_acidente || 0,
      cobertura_auxilio_funeral: plano?.cobertura_auxilio_funeral || 0,
      tipo_seguro: plano?.tipo_seguro || 'vida',
      cnpj_id: plano?.cnpj_id || preSelectedCnpjId || '',
    },
  });

  // Reset form when modal opens/closes or when plano changes
  useEffect(() => {
    if (open) {
      form.reset({
        seguradora: plano?.seguradora || '',
        valor_mensal: plano?.valor_mensal || 0,
        cobertura_morte: plano?.cobertura_morte || 0,
        cobertura_morte_acidental: plano?.cobertura_morte_acidental || 0,
        cobertura_invalidez_acidente: plano?.cobertura_invalidez_acidente || 0,
        cobertura_auxilio_funeral: plano?.cobertura_auxilio_funeral || 0,
        tipo_seguro: plano?.tipo_seguro || 'vida',
        cnpj_id: plano?.cnpj_id || preSelectedCnpjId || '',
      });
    }
  }, [open, plano, preSelectedCnpjId, form]);

  const onSubmit = async (data: DadosPlanoFormData) => {
    try {
      console.log('📝 Dados do formulário:', data);

      if (plano?.id) {
        // Atualizar plano existente
        await updatePlano.mutateAsync({
          plano_id: plano.id,
          cnpj_id: data.cnpj_id,
          seguradora: data.seguradora,
          valor_mensal: data.valor_mensal,
          cobertura_morte: data.cobertura_morte,
          cobertura_morte_acidental: data.cobertura_morte_acidental,
          cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
          cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
          tipo_seguro: data.tipo_seguro,
        });
      } else {
        // Criar novo plano
        await createPlano.mutateAsync({
          cnpj_id: data.cnpj_id,
          seguradora: data.seguradora,
          valor_mensal: data.valor_mensal,
          cobertura_morte: data.cobertura_morte,
          cobertura_morte_acidental: data.cobertura_morte_acidental,
          cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
          cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
          tipo_seguro: data.tipo_seguro,
        });
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('❌ Erro ao salvar plano:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plano ? 'Editar Plano' : 'Novo Plano de Seguro'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* CNPJ Selection */}
            {!preSelectedCnpjId && (
              <FormField
                control={form.control}
                name="cnpj_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CNPJ</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!!plano?.id}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um CNPJ" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cnpjs
                          .filter(cnpj => !cnpj.temPlano)
                          .map((cnpj) => (
                            <SelectItem key={cnpj.id} value={cnpj.id}>
                              {cnpj.cnpj} - {cnpj.razao_social}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="seguradora"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seguradora</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: MAG Seguros" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo_seguro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Seguro</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vida">Vida</SelectItem>
                          <SelectItem value="saude">Saúde</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valor_mensal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Mensal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Coberturas */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Coberturas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cobertura_morte"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cobertura Morte</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cobertura_morte_acidental"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cobertura Morte Acidental</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cobertura_invalidez_acidente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cobertura Invalidez por Acidente</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cobertura_auxilio_funeral"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auxílio Funeral</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Preview dos valores */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo do Plano</h4>
              <div className="text-sm space-y-1">
                <p><strong>Tipo:</strong> {form.watch('tipo_seguro')}</p>
                <p><strong>Valor Mensal:</strong> {formatCurrency(form.watch('valor_mensal'))}</p>
                <p><strong>Cobertura Morte:</strong> {formatCurrency(form.watch('cobertura_morte'))}</p>
                <p><strong>Morte Acidental:</strong> {formatCurrency(form.watch('cobertura_morte_acidental'))}</p>
                <p><strong>Invalidez por Acidente:</strong> {formatCurrency(form.watch('cobertura_invalidez_acidente'))}</p>
                <p><strong>Auxílio Funeral:</strong> {formatCurrency(form.watch('cobertura_auxilio_funeral'))}</p>
                <div className="mt-2 p-2 bg-blue-50 rounded">
                  <p className="text-blue-700"><strong>Comissão Estimada:</strong> {formatCurrency(form.watch('valor_mensal') * (form.watch('tipo_seguro') === 'vida' ? 0.20 : 0.05))}</p>
                  <p className="text-xs text-blue-600">
                    {form.watch('tipo_seguro') === 'vida' ? '20% para seguros de vida' : '5% para outros tipos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={createPlano.isPending || updatePlano.isPending}
              >
                {createPlano.isPending || updatePlano.isPending 
                  ? 'Salvando...' 
                  : (plano ? 'Atualizar' : 'Criar Plano')
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
