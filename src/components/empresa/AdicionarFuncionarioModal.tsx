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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFuncionariosMutation } from '@/hooks/useFuncionariosMutation';
import { useCheckCPF } from '@/hooks/useCheckCPF';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

const funcionarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cargo: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
  salario: z.number().min(0, 'Salário deve ser maior que zero'),
  estado_civil: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface AdicionarFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cnpjId: string;
  planoSeguradora: string;
  onFuncionarioAdded?: () => void;
}

export const AdicionarFuncionarioModal: React.FC<AdicionarFuncionarioModalProps> = ({
  open,
  onOpenChange,
  cnpjId,
  planoSeguradora,
  onFuncionarioAdded,
}) => {
  const { createFuncionario, isCreating } = useFuncionariosMutation(cnpjId, onFuncionarioAdded);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      data_nascimento: '',
      cargo: '',
      salario: 0,
      estado_civil: 'solteiro',
      email: '',
    },
  });

  const estadoCivil = watch('estado_civil');
  const cpfValue = watch('cpf');

  // Verificar duplicação de CPF em tempo real
  const { isDuplicate, existingFuncionario, isChecking } = useCheckCPF({
    cpf: cpfValue,
    cnpjId,
    enabled: open && cpfValue.length >= 11
  });

  const onSubmit = async (data: FuncionarioFormData) => {
    // Verificar duplicação antes de submeter
    if (isDuplicate) {
      toast.error(`CPF já cadastrado para o funcionário: ${existingFuncionario?.nome}`);
      return;
    }

    try {
      await createFuncionario.mutateAsync({
        ...data,
        email: data.email || undefined,
        cnpj_id: cnpjId,
      });

      toast.success('Funcionário adicionado com sucesso!');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao adicionar funcionário';
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar Funcionário ao Plano</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Plano: {planoSeguradora}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome Completo *</Label>
              <Input
                id="nome"
                {...register('nome')}
                placeholder="Nome do funcionário"
                className={errors.nome ? 'border-destructive' : ''}
              />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <div className="relative">
                <Input
                  id="cpf"
                  {...register('cpf')}
                  placeholder="000.000.000-00"
                  className={errors.cpf || isDuplicate ? 'border-destructive' : ''}
                />
                {isChecking && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
              {isDuplicate && existingFuncionario && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span>CPF já cadastrado para: {existingFuncionario.nome}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register('data_nascimento')}
                className={errors.data_nascimento ? 'border-destructive' : ''}
              />
              {errors.data_nascimento && (
                <p className="text-sm text-destructive">{errors.data_nascimento.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo *</Label>
              <Input
                id="cargo"
                {...register('cargo')}
                placeholder="Cargo do funcionário"
                className={errors.cargo ? 'border-destructive' : ''}
              />
              {errors.cargo && (
                <p className="text-sm text-destructive">{errors.cargo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salario">Salário *</Label>
              <Input
                id="salario"
                type="number"
                step="0.01"
                {...register('salario', { valueAsNumber: true })}
                placeholder="0.00"
                className={errors.salario ? 'border-destructive' : ''}
              />
              {errors.salario && (
                <p className="text-sm text-destructive">{errors.salario.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado_civil">Estado Civil *</Label>
              <Select value={estadoCivil} onValueChange={(value) => setValue('estado_civil', value as any)}>
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
              {errors.estado_civil && (
                <p className="text-sm text-destructive">{errors.estado_civil.message}</p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="email@exemplo.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Adicionar Funcionário
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
