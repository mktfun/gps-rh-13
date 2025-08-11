
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { usePlanosMutation } from '@/hooks/usePlanosMutation';
import { toast } from 'sonner';

interface ConfigurarPlanoVidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnpjId: string;
  onPlanoCreated?: () => void;
}

export const ConfigurarPlanoVidaModal: React.FC<ConfigurarPlanoVidaModalProps> = ({
  isOpen,
  onClose,
  cnpjId,
  onPlanoCreated
}) => {
  const [formData, setFormData] = useState({
    seguradora: '',
    valor_mensal: '',
    cobertura_morte: '',
    cobertura_morte_acidental: '',
    cobertura_invalidez_acidente: '',
    cobertura_auxilio_funeral: ''
  });

  const { createPlano } = usePlanosMutation();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.seguradora.trim()) {
      toast.error('Nome da seguradora é obrigatório');
      return;
    }

    try {
      await createPlano.mutateAsync({
        cnpj_id: cnpjId,
        seguradora: formData.seguradora,
        valor_mensal: parseFloat(formData.valor_mensal) || 0,
        cobertura_morte: parseFloat(formData.cobertura_morte) || 0,
        cobertura_morte_acidental: parseFloat(formData.cobertura_morte_acidental) || 0,
        cobertura_invalidez_acidente: parseFloat(formData.cobertura_invalidez_acidente) || 0,
        cobertura_auxilio_funeral: parseFloat(formData.cobertura_auxilio_funeral) || 0,
        tipo_seguro: 'vida'
      });

      toast.success('Plano de vida configurado com sucesso!');
      onPlanoCreated?.();
      onClose();
      
      // Reset form
      setFormData({
        seguradora: '',
        valor_mensal: '',
        cobertura_morte: '',
        cobertura_morte_acidental: '',
        cobertura_invalidez_acidente: '',
        cobertura_auxilio_funeral: ''
      });
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      toast.error('Erro ao configurar plano de vida');
    }
  };

  const handleClose = () => {
    setFormData({
      seguradora: '',
      valor_mensal: '',
      cobertura_morte: '',
      cobertura_morte_acidental: '',
      cobertura_invalidez_acidente: '',
      cobertura_auxilio_funeral: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurar Plano de Seguro de Vida</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seguradora">Seguradora *</Label>
                <Input
                  id="seguradora"
                  value={formData.seguradora}
                  onChange={(e) => handleInputChange('seguradora', e.target.value)}
                  placeholder="Ex: Bradesco Seguros"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="valor_mensal">Valor Mensal (R$)</Label>
                <Input
                  id="valor_mensal"
                  type="number"
                  step="0.01"
                  value={formData.valor_mensal}
                  onChange={(e) => handleInputChange('valor_mensal', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coberturas (R$)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cobertura_morte">Morte</Label>
                  <Input
                    id="cobertura_morte"
                    type="number"
                    step="0.01"
                    value={formData.cobertura_morte}
                    onChange={(e) => handleInputChange('cobertura_morte', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cobertura_morte_acidental">Morte Acidental</Label>
                  <Input
                    id="cobertura_morte_acidental"
                    type="number"
                    step="0.01"
                    value={formData.cobertura_morte_acidental}
                    onChange={(e) => handleInputChange('cobertura_morte_acidental', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cobertura_invalidez_acidente">Invalidez por Acidente</Label>
                  <Input
                    id="cobertura_invalidez_acidente"
                    type="number"
                    step="0.01"
                    value={formData.cobertura_invalidez_acidente}
                    onChange={(e) => handleInputChange('cobertura_invalidez_acidente', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="cobertura_auxilio_funeral">Auxílio Funeral</Label>
                  <Input
                    id="cobertura_auxilio_funeral"
                    type="number"
                    step="0.01"
                    value={formData.cobertura_auxilio_funeral}
                    onChange={(e) => handleInputChange('cobertura_auxilio_funeral', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createPlano.isPending}
            >
              {createPlano.isPending ? 'Configurando...' : 'Configurar Plano'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
