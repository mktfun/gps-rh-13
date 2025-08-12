
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useCreatePlanoMutation } from '@/hooks/useCreatePlanoMutation';

interface ConfigurarPlanoModalProps {
  open: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude';
}

const createPlanoSchema = z.object({
  seguradora: z.string().min(1, 'Seguradora é obrigatória'),
  valor_mensal: z.number().positive('Valor mensal deve ser positivo'),
  cobertura_morte: z.number().positive('Cobertura por morte deve ser positiva').optional(),
  cobertura_morte_acidental: z.number().positive('Cobertura morte acidental deve ser positiva').optional(),
  cobertura_invalidez_acidente: z.number().positive('Cobertura invalidez por acidente deve ser positiva').optional(),
  cobertura_auxilio_funeral: z.number().positive('Auxílio funeral deve ser positivo').optional(),
});

type CreatePlanoFormData = z.infer<typeof createPlanoSchema>;

export const ConfigurarPlanoModal: React.FC<ConfigurarPlanoModalProps> = ({
  open,
  onOpenChange,
  cnpjId,
  tipoSeguro
}) => {
  const createPlanoMutation = useCreatePlanoMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid }
  } = useForm<CreatePlanoFormData>({
    resolver: zodResolver(createPlanoSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: CreatePlanoFormData) => {
    try {
      await createPlanoMutation.mutateAsync({
        cnpj_id: cnpjId,
        tipo_seguro: tipoSeguro,
        seguradora: data.seguradora,
        valor_mensal: data.valor_mensal,
        cobertura_morte: data.cobertura_morte,
        cobertura_morte_acidental: data.cobertura_morte_acidental,
        cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
      });
      
      // Reset form and close modal on success
      reset();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Erro ao submeter formulário:', error);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const getModalTitle = () => {
    return tipoSeguro === 'vida' 
      ? 'Configurar Plano de Seguro de Vida'
      : 'Configurar Plano de Saúde';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Seguradora */}
          <div className="space-y-2">
            <Label htmlFor="seguradora">Seguradora *</Label>
            <Input
              id="seguradora"
              {...register('seguradora')}
              placeholder="Ex: SulAmérica, Bradesco Seguros..."
            />
            {errors.seguradora && (
              <p className="text-sm text-destructive">{errors.seguradora.message}</p>
            )}
          </div>

          {/* Valor Mensal */}
          <div className="space-y-2">
            <Label htmlFor="valor_mensal">Valor Mensal (R$) *</Label>
            <Input
              id="valor_mensal"
              type="number"
              step="0.01"
              min="0"
              {...register('valor_mensal', { valueAsNumber: true })}
              placeholder="0,00"
            />
            {errors.valor_mensal && (
              <p className="text-sm text-destructive">{errors.valor_mensal.message}</p>
            )}
          </div>

          {/* Coberturas - apenas para Seguro de Vida */}
          {tipoSeguro === 'vida' && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Coberturas</h3>

                <div className="grid grid-cols-1 gap-4">
                  {/* Cobertura por Morte */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_morte">Cobertura por Morte (R$)</Label>
                    <Input
                      id="cobertura_morte"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cobertura_morte', { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {errors.cobertura_morte && (
                      <p className="text-sm text-destructive">{errors.cobertura_morte.message}</p>
                    )}
                  </div>

                  {/* Cobertura Morte Acidental */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_morte_acidental">Cobertura Morte Acidental (R$)</Label>
                    <Input
                      id="cobertura_morte_acidental"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cobertura_morte_acidental', { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {errors.cobertura_morte_acidental && (
                      <p className="text-sm text-destructive">{errors.cobertura_morte_acidental.message}</p>
                    )}
                  </div>

                  {/* Cobertura Invalidez por Acidente */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_invalidez_acidente">Cobertura Invalidez por Acidente (R$)</Label>
                    <Input
                      id="cobertura_invalidez_acidente"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cobertura_invalidez_acidente', { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {errors.cobertura_invalidez_acidente && (
                      <p className="text-sm text-destructive">{errors.cobertura_invalidez_acidente.message}</p>
                    )}
                  </div>

                  {/* Auxílio Funeral */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_auxilio_funeral">Auxílio Funeral (R$)</Label>
                    <Input
                      id="cobertura_auxilio_funeral"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cobertura_auxilio_funeral', { valueAsNumber: true })}
                      placeholder="0,00"
                    />
                    {errors.cobertura_auxilio_funeral && (
                      <p className="text-sm text-destructive">{errors.cobertura_auxilio_funeral.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={createPlanoMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isValid || createPlanoMutation.isPending}
            >
              {createPlanoMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Configurar Plano
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
