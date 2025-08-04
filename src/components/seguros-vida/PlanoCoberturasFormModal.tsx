
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanoCoberturasFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const PlanoCoberturasFormModal: React.FC<PlanoCoberturasFormModalProps> = ({
  isOpen,
  onClose,
  plano,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    cobertura_morte: '',
    cobertura_morte_acidental: '',
    cobertura_invalidez_acidente: '',
    cobertura_auxilio_funeral: ''
  });

  useEffect(() => {
    if (plano) {
      setFormData({
        cobertura_morte: plano.cobertura_morte?.toString() || '',
        cobertura_morte_acidental: plano.cobertura_morte_acidental?.toString() || '',
        cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente?.toString() || '',
        cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral?.toString() || ''
      });
    }
  }, [plano]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cobertura_morte || !formData.cobertura_morte_acidental || 
        !formData.cobertura_invalidez_acidente || !formData.cobertura_auxilio_funeral) {
      toast.error('Por favor, preencha todos os campos de cobertura.');
      return;
    }

    const submitData = {
      cobertura_morte: parseFloat(formData.cobertura_morte) || 0,
      cobertura_morte_acidental: parseFloat(formData.cobertura_morte_acidental) || 0,
      cobertura_invalidez_acidente: parseFloat(formData.cobertura_invalidez_acidente) || 0,
      cobertura_auxilio_funeral: parseFloat(formData.cobertura_auxilio_funeral) || 0
    };

    onSubmit(submitData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Coberturas do Plano</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cobertura_morte">Cobertura Morte Natural *</Label>
            <Input
              id="cobertura_morte"
              type="number"
              step="0.01"
              value={formData.cobertura_morte}
              onChange={(e) => handleChange('cobertura_morte', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cobertura_morte_acidental">Cobertura Morte Acidental *</Label>
            <Input
              id="cobertura_morte_acidental"
              type="number"
              step="0.01"
              value={formData.cobertura_morte_acidental}
              onChange={(e) => handleChange('cobertura_morte_acidental', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cobertura_invalidez_acidente">Cobertura Invalidez por Acidente *</Label>
            <Input
              id="cobertura_invalidez_acidente"
              type="number"
              step="0.01"
              value={formData.cobertura_invalidez_acidente}
              onChange={(e) => handleChange('cobertura_invalidez_acidente', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="cobertura_auxilio_funeral">Auxílio Funeral *</Label>
            <Input
              id="cobertura_auxilio_funeral"
              type="number"
              step="0.01"
              value={formData.cobertura_auxilio_funeral}
              onChange={(e) => handleChange('cobertura_auxilio_funeral', e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
