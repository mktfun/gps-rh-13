import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDadosPlanos } from '@/hooks/useDadosPlanos';
import { Database } from '@/integrations/supabase/types';

type DadoPlano = Database['public']['Tables']['dados_planos']['Row'];

const formSchema = z.object({
  seguradora: z.string().min(3, "O nome da seguradora é obrigatório."),
  valor_mensal: z.number().positive("O valor mensal deve ser positivo."),
  cobertura_morte: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_morte_acidental: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_invalidez_acidente: z.number().min(0, "O valor não pode ser negativo."),
  cobertura_auxilio_funeral: z.number().min(0, "O valor não pode ser negativo."),
});

type FormValues = z.infer<typeof formSchema>;

interface DadoPlanoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cnpjId: string;
  dadoPlano?: DadoPlano | null;
}

export const DadoPlanoModal = ({ 
  open, 
  onOpenChange, 
  cnpjId,
  dadoPlano 
}: DadoPlanoModalProps) => {
  const { addDadoPlano, updateDadoPlano } = useDadosPlanos({ cnpjId });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      seguradora: dadoPlano?.seguradora || '',
      valor_mensal: dadoPlano?.valor_mensal || 0,
      cobertura_morte: dadoPlano?.cobertura_morte || 0,
      cobertura_morte_acidental: dadoPlano?.cobertura_morte_acidental || 0,
      cobertura_invalidez_acidente: dadoPlano?.cobertura_invalidez_acidente || 0,
      cobertura_auxilio_funeral: dadoPlano?.cobertura_auxilio_funeral || 0,
    },
  });

  React.useEffect(() => {
    if (dadoPlano) {
      form.reset({
        seguradora: dadoPlano.seguradora,
        valor_mensal: dadoPlano.valor_mensal,
        cobertura_morte: dadoPlano.cobertura_morte,
        cobertura_morte_acidental: dadoPlano.cobertura_morte_acidental,
        cobertura_invalidez_acidente: dadoPlano.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: dadoPlano.cobertura_auxilio_funeral,
      });
    } else {
      form.reset({
        seguradora: '',
        valor_mensal: 0,
        cobertura_morte: 0,
        cobertura_morte_acidental: 0,
        cobertura_invalidez_acidente: 0,
        cobertura_auxilio_funeral: 0,
      });
    }
  }, [dadoPlano, form]);

  const onSubmit = (values: FormValues) => {
    const dataToSubmit = {
      cnpj_id: cnpjId,
      seguradora: values.seguradora,
      valor_mensal: parseFloat(values.valor_mensal.toString()),
      cobertura_morte: parseFloat(values.cobertura_morte.toString()),
      cobertura_morte_acidental: parseFloat(values.cobertura_morte_acidental.toString()),
      cobertura_invalidez_acidente: parseFloat(values.cobertura_invalidez_acidente.toString()),
      cobertura_auxilio_funeral: parseFloat(values.cobertura_auxilio_funeral.toString()),
    };

    if (dadoPlano) {
      updateDadoPlano.mutate({ id: dadoPlano.id, ...dataToSubmit });
    } else {
      addDadoPlano.mutate(dataToSubmit);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {dadoPlano ? 'Editar Dados do Plano' : 'Configurar Dados do Plano'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="seguradora"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Seguradora</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da seguradora" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="valor_mensal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mensal (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cobertura_morte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cobertura Morte (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cobertura_morte_acidental"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cobertura Morte Acidental (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                    <FormLabel>Cobertura Invalidez Acidente (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cobertura_auxilio_funeral"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cobertura Auxílio Funeral (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={addDadoPlano.isPending || updateDadoPlano.isPending}
              >
                {dadoPlano ? 'Atualizar' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
