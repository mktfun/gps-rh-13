import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDependentes } from '@/hooks/useDependentes';

interface AdicionarDependenteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funcionarioId: string;
}

export const AdicionarDependenteModal: React.FC<AdicionarDependenteModalProps> = ({
  open,
  onOpenChange,
  funcionarioId,
}) => {
  const { createDependente } = useDependentes(funcionarioId);
  const [formData, setFormData] = useState({
    nome: '',
    data_nascimento: '',
    parentesco: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createDependente.mutateAsync({
      funcionario_id: funcionarioId,
      nome: formData.nome,
      data_nascimento: formData.data_nascimento,
      parentesco: formData.parentesco,
    });

    setFormData({ nome: '', data_nascimento: '', parentesco: '' });
    onOpenChange(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Dependente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              required
              placeholder="Digite o nome do dependente"
            />
          </div>

          <div>
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <Input
              id="data_nascimento"
              type="date"
              value={formData.data_nascimento}
              onChange={(e) => handleChange('data_nascimento', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="parentesco">Parentesco</Label>
            <Select value={formData.parentesco} onValueChange={(value) => handleChange('parentesco', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o parentesco" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conjuge">Cônjuge</SelectItem>
                <SelectItem value="filho">Filho(a)</SelectItem>
                <SelectItem value="pai">Pai</SelectItem>
                <SelectItem value="mae">Mãe</SelectItem>
                <SelectItem value="irmao">Irmão(ã)</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createDependente.isPending}>
              {createDependente.isPending ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
