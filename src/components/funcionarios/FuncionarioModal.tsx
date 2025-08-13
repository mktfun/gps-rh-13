import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { useCnpjs } from '@/hooks/useCnpjs';
import { useCheckCPF } from '@/hooks/useCheckCPF';

interface FuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionario?: any;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  empresaId?: string;
}

const FuncionarioModal: React.FC<FuncionarioModalProps> = ({
  isOpen,
  onClose,
  funcionario,
  onSubmit,
  isLoading = false,
  empresaId
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    cargo: '',
    salario: '',
    estado_civil: '',
    email: '',
    cnpj_id: ''
  });

  // Buscar CNPJs da empresa para o select
  const { cnpjs } = useCnpjs({ empresaId: empresaId || undefined });

  // Verificar duplicação de CPF em tempo real (apenas para novos funcionários)
  const { isDuplicate, existingFuncionario, isChecking } = useCheckCPF({
    cpf: formData.cpf,
    cnpjId: formData.cnpj_id,
    enabled: !funcionario && formData.cpf.length >= 11 && formData.cnpj_id.length > 0
  });

  useEffect(() => {
    if (funcionario) {
      setFormData({
        nome: funcionario.nome || '',
        cpf: funcionario.cpf || '',
        data_nascimento: funcionario.data_nascimento || '',
        cargo: funcionario.cargo || '',
        salario: funcionario.salario?.toString() || '',
        estado_civil: funcionario.estado_civil || '',
        email: funcionario.email || '',
        cnpj_id: funcionario.cnpj_id || ''
      });
    } else {
      setFormData({
        nome: '',
        cpf: '',
        data_nascimento: '',
        cargo: '',
        salario: '',
        estado_civil: '',
        email: '',
        cnpj_id: ''
      });
    }
  }, [funcionario]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.cpf || !formData.cargo || !formData.cnpj_id) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      });
      return;
    }

    // Verificar duplicação de CPF apenas para novos funcionários
    if (!funcionario && isDuplicate) {
      toast({
        title: 'CPF Duplicado',
        description: `CPF já cadastrado para o funcionário: ${existingFuncionario?.nome}`,
        variant: 'destructive'
      });
      return;
    }

    const submitData = {
      ...formData,
      salario: parseFloat(formData.salario) || 0,
      idade: formData.data_nascimento ?
        new Date().getFullYear() - new Date(formData.data_nascimento).getFullYear() : 0
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleChange('nome', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <div className="relative">
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  className={isDuplicate && !funcionario ? 'border-destructive' : ''}
                  required
                />
                {isChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {isDuplicate && !funcionario && existingFuncionario && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertCircle className="h-4 w-4" />
                  <span>CPF já cadastrado para: {existingFuncionario.nome}</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => handleChange('data_nascimento', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                value={formData.cargo}
                onChange={(e) => handleChange('cargo', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salario">Salário</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                value={formData.salario}
                onChange={(e) => handleChange('salario', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="estado_civil">Estado Civil</Label>
              <Select value={formData.estado_civil} onValueChange={(value) => handleChange('estado_civil', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="cnpj_id">CNPJ da Empresa *</Label>
              <Select value={formData.cnpj_id} onValueChange={(value) => handleChange('cnpj_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o CNPJ..." />
                </SelectTrigger>
                <SelectContent>
                  {cnpjs?.map((cnpj) => (
                    <SelectItem key={cnpj.id} value={cnpj.id}>
                      {cnpj.razao_social} - {cnpj.cnpj}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {funcionario ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FuncionarioModal;
