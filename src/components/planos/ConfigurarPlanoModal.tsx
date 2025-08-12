
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

// Schema unificado (superset) para ambos os tipos de plano
const planoFormSchema = z.object({
  seguradora: z.string().min(1, 'Seguradora é obrigatória'),
  valor_mensal: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleanValue = val.replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      }
      return Number(val) || 0;
    },
    z.number().positive('Valor mensal deve ser positivo')
  ),
  cobertura_morte: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleanValue = val.replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      }
      return Number(val) || 0;
    },
    z.number().min(0, 'Cobertura por morte deve ser positiva').optional()
  ),
  cobertura_morte_acidental: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleanValue = val.replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      }
      return Number(val) || 0;
    },
    z.number().min(0, 'Cobertura morte acidental deve ser positiva').optional()
  ),
  cobertura_invalidez_acidente: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleanValue = val.replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      }
      return Number(val) || 0;
    },
    z.number().min(0, 'Cobertura invalidez por acidente deve ser positiva').optional()
  ),
  cobertura_auxilio_funeral: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const cleanValue = val.replace(/[R$\s]/g, '').replace(',', '.');
        return parseFloat(cleanValue) || 0;
      }
      return Number(val) || 0;
    },
    z.number().min(0, 'Auxílio funeral deve ser positivo').optional()
  ),
});

type PlanoFormData = z.infer<typeof planoFormSchema>;

const formatCurrency = (value: string) => {
  const numericValue = value.replace(/[^0-9,]/g, '');
  if (numericValue) {
    return `R$ ${numericValue}`;
  }
  return '';
};

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
    setValue,
    formState: { errors, isValid }
  } = useForm<PlanoFormData>({
    resolver: zodResolver(planoFormSchema),
    mode: 'onChange'
  });

  const onSubmit = async (data: PlanoFormData) => {
    try {
      const planoData = {
        cnpj_id: cnpjId,
        tipo_seguro: tipoSeguro,
        seguradora: data.seguradora,
        valor_mensal: data.valor_mensal,
        cobertura_morte: tipoSeguro === 'vida' ? (data.cobertura_morte || 0) : 0,
        cobertura_morte_acidental: tipoSeguro === 'vida' ? (data.cobertura_morte_acidental || 0) : 0,
        cobertura_invalidez_acidente: tipoSeguro === 'vida' ? (data.cobertura_invalidez_acidente || 0) : 0,
        cobertura_auxilio_funeral: tipoSeguro === 'vida' ? (data.cobertura_auxilio_funeral || 0) : 0,
      };
      
      await createPlanoMutation.mutateAsync(planoData);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
    }
  };

  const handleCancel = () => {
    reset();
    onOpenChange(false);
  };

  const handleCurrencyChange = (fieldName: keyof PlanoFormData, value: string) => {
    const formattedValue = formatCurrency(value);
    setValue(fieldName, formattedValue as any, { shouldValidate: true });
  };

  const tipoLabel = tipoSeguro === 'vida' ? 'Seguro de Vida' : 'Plano de Saúde';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar {tipoLabel}</DialogTitle>
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
            <Label htmlFor="valor_mensal">Valor Mensal *</Label>
            <Input
              id="valor_mensal"
              {...register('valor_mensal')}
              placeholder="R$ 0,00"
              onChange={(e) => handleCurrencyChange('valor_mensal', e.target.value)}
            />
            {errors.valor_mensal && (
              <p className="text-sm text-destructive">{errors.valor_mensal.message}</p>
            )}
          </div>

          {/* Campos específicos para Seguro de Vida */}
          {tipoSeguro === 'vida' && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Coberturas do Seguro de Vida</h3>

                <div className="grid grid-cols-1 gap-4">
                  {/* Cobertura por Morte */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_morte">Cobertura por Morte Natural</Label>
                    <Input
                      id="cobertura_morte"
                      {...register('cobertura_morte')}
                      placeholder="R$ 0,00"
                      onChange={(e) => handleCurrencyChange('cobertura_morte', e.target.value)}
                    />
                    {errors.cobertura_morte && (
                      <p className="text-sm text-destructive">{errors.cobertura_morte.message}</p>
                    )}
                  </div>

                  {/* Cobertura Morte Acidental */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_morte_acidental">Cobertura por Morte Acidental</Label>
                    <Input
                      id="cobertura_morte_acidental"
                      {...register('cobertura_morte_acidental')}
                      placeholder="R$ 0,00"
                      onChange={(e) => handleCurrencyChange('cobertura_morte_acidental', e.target.value)}
                    />
                    {errors.cobertura_morte_acidental && (
                      <p className="text-sm text-destructive">{errors.cobertura_morte_acidental.message}</p>
                    )}
                  </div>

                  {/* Cobertura Invalidez por Acidente */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_invalidez_acidente">Cobertura por Invalidez por Acidente</Label>
                    <Input
                      id="cobertura_invalidez_acidente"
                      {...register('cobertura_invalidez_acidente')}
                      placeholder="R$ 0,00"
                      onChange={(e) => handleCurrencyChange('cobertura_invalidez_acidente', e.target.value)}
                    />
                    {errors.cobertura_invalidez_acidente && (
                      <p className="text-sm text-destructive">{errors.cobertura_invalidez_acidente.message}</p>
                    )}
                  </div>

                  {/* Auxílio Funeral */}
                  <div className="space-y-2">
                    <Label htmlFor="cobertura_auxilio_funeral">Auxílio Funeral</Label>
                    <Input
                      id="cobertura_auxilio_funeral"
                      {...register('cobertura_auxilio_funeral')}
                      placeholder="R$ 0,00"
                      onChange={(e) => handleCurrencyChange('cobertura_auxilio_funeral', e.target.value)}
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
              Configurar {tipoLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
