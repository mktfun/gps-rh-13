
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
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useCriarFuncionarioComPlanos } from '@/hooks/useCriarFuncionarioComPlanos';
import { usePlanosDisponiveis } from '@/hooks/usePlanosDisponiveis';
import { toast } from 'sonner';
import { Loader2, Heart, Cross } from 'lucide-react';

const funcionarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  data_admissao: z.string().optional().or(z.literal('')),
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
  const { criarFuncionario, isCreating } = useCriarFuncionarioComPlanos();
  const [incluirSaude, setIncluirSaude] = React.useState(false);
  const [incluirVida, setIncluirVida] = React.useState(false);
  
  const { data: planosDisponiveis = [] } = usePlanosDisponiveis(cnpjId);
  
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
      data_admissao: '',
      cargo: '',
      salario: 0,
      estado_civil: 'solteiro',
      email: '',
    },
  });

  const estadoCivil = watch('estado_civil');

  const onSubmit = async (data: FuncionarioFormData) => {
    try {
      await criarFuncionario.mutateAsync({
        ...data,
        email: data.email || undefined,
        data_admissao: data.data_admissao || undefined,
        cnpj_id: cnpjId,
        incluir_saude: incluirSaude,
        incluir_vida: incluirVida,
      });
      
      reset();
      setIncluirSaude(false);
      setIncluirVida(false);
      onOpenChange(false);
      onFuncionarioAdded?.();
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      toast.error('Erro ao adicionar funcionário');
    }
  };

  const handleClose = () => {
    reset();
    setIncluirSaude(false);
    setIncluirVida(false);
    onOpenChange(false);
  };

  const planoSaude = planosDisponiveis.find(p => p.tipo_seguro === 'saude');
  const planoVida = planosDisponiveis.find(p => p.tipo_seguro === 'vida');

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Funcionário</DialogTitle>
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
              <Input
                id="cpf"
                {...register('cpf')}
                placeholder="000.000.000-00"
                className={errors.cpf ? 'border-destructive' : ''}
              />
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
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
              <Label htmlFor="data_admissao">Data de Admissão (opcional)</Label>
              <Input
                id="data_admissao"
                type="date"
                {...register('data_admissao')}
                className={errors.data_admissao ? 'border-destructive' : ''}
              />
              {errors.data_admissao && (
                <p className="text-sm text-destructive">{errors.data_admissao.message}</p>
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

          {/* Seção de Seleção de Planos */}
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h3 className="text-sm font-semibold">Vincular Planos Disponíveis</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione em quais planos o funcionário deve ser incluído
              </p>
            </div>

            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Plano de Saúde */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Cross className="h-4 w-4 text-primary" />
                      <label className="text-sm font-medium">
                        Incluir no Plano de Saúde
                      </label>
                    </div>
                    {planoSaude ? (
                      <p className="text-xs text-muted-foreground">
                        Seguradora: {planoSaude.seguradora}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhum plano de saúde disponível para o CNPJ selecionado
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={incluirSaude}
                    onCheckedChange={setIncluirSaude}
                    disabled={!planoSaude}
                  />
                </div>

                {/* Seguro de Vida */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-primary" />
                      <label className="text-sm font-medium">
                        Incluir no Seguro de Vida
                      </label>
                    </div>
                    {planoVida ? (
                      <p className="text-xs text-muted-foreground">
                        Seguradora: {planoVida.seguradora}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Nenhum seguro de vida disponível para o CNPJ selecionado
                      </p>
                    )}
                  </div>
                  <Switch
                    checked={incluirVida}
                    onCheckedChange={setIncluirVida}
                    disabled={!planoVida}
                  />
                </div>
              </CardContent>
            </Card>
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
