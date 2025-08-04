
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PlanoInfoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export const PlanoInfoFormModal: React.FC<PlanoInfoFormModalProps> = ({
  isOpen,
  onClose,
  plano,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    empresa_nome: '',
    cnpj_razao_social: '',
    seguradora: '',
    valor_mensal: ''
  });

  useEffect(() => {
    if (plano) {
      setFormData({
        empresa_nome: plano.empresa_nome || '',
        cnpj_razao_social: plano.cnpj_razao_social || '',
        seguradora: plano.seguradora || '',
        valor_mensal: plano.valor_mensal?.toString() || ''
      });
    }
  }, [plano]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.seguradora || !formData.valor_mensal) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const submitData = {
      ...formData,
      valor_mensal: parseFloat(formData.valor_mensal) || 0
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
          <DialogTitle>Editar Informações do Plano</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="empresa_nome">Empresa</Label>
            <Input
              id="empresa_nome"
              value={formData.empresa_nome}
              onChange={(e) => handleChange('empresa_nome', e.target.value)}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="cnpj_razao_social">CNPJ/Razão Social</Label>
            <Input
              id="cnpj_razao_social"
              value={formData.cnpj_razao_social}
              onChange={(e) => handleChange('cnpj_razao_social', e.target.value)}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="seguradora">Seguradora *</Label>
            <Input
              id="seguradora"
              value={formData.seguradora}
              onChange={(e) => handleChange('seguradora', e.target.value)}
              placeholder="Digite o nome da seguradora"
              required
            />
          </div>

          <div>
            <Label htmlFor="valor_mensal">Valor Mensal por Funcionário *</Label>
            <Input
              id="valor_mensal"
              type="number"
              step="0.01"
              value={formData.valor_mensal}
              onChange={(e) => handleChange('valor_mensal', e.target.value)}
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
