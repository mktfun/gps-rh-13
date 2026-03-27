
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
import { supabase } from '@/integrations/supabase/client';
import { usePlanosDisponiveis } from '@/hooks/usePlanosDisponiveis';
import { useCnpjs } from '@/hooks/useCnpjs';
import { toast } from 'sonner';
import { Loader2, Heart, Cross, CheckCircle2 } from 'lucide-react';

const funcionarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100, 'Nome muito longo'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  data_admissao: z.string().optional().or(z.literal('')),
  cargo: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres').max(100, 'Cargo muito longo'),
  salario: z.number().min(0.01, 'Salário deve ser maior que zero'),
  estado_civil: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  cnpj_id: z.string().min(1, 'CNPJ é obrigatório'),
});

type FuncionarioFormData = z.infer<typeof funcionarioSchema>;

interface AdicionarFuncionarioModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cnpjId?: string;
  empresaId?: string;
  planoSeguradora: string;
  onFuncionarioAdded?: () => void;
}

export const AdicionarFuncionarioModal: React.FC<AdicionarFuncionarioModalProps> = ({
  open,
  onOpenChange,
  cnpjId,
  empresaId,
  planoSeguradora,
  onFuncionarioAdded,
}) => {
  const { criarFuncionario, isCreating } = useCriarFuncionarioComPlanos();
  const [incluirSaude, setIncluirSaude] = React.useState(false);
  const [incluirVida, setIncluirVida] = React.useState(false);
  const [selectedCnpjId, setSelectedCnpjId] = React.useState(cnpjId || '');
  const [cpfWarning, setCpfWarning] = React.useState<string | null>(null);
  const [isCheckingCpf, setIsCheckingCpf] = React.useState(false);
  
  const { data: planosDisponiveis = [] } = usePlanosDisponiveis(selectedCnpjId || null);
  
  const { cnpjs: cnpjsData } = useCnpjs({ 
    empresaId: empresaId || undefined,
    page: 1,
    pageSize: 100
  });

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
      salario: undefined as unknown as number,
      estado_civil: 'solteiro',
      email: '',
      cnpj_id: cnpjId || '',
    },
  });

  const estadoCivil = watch('estado_civil');
  const watchedCnpjId = watch('cnpj_id');
  const [cpfOk, setCpfOk] = React.useState(false);

  React.useEffect(() => {
    if (watchedCnpjId) {
      setSelectedCnpjId(watchedCnpjId);
    }
  }, [watchedCnpjId]);

  // Check CPF against existing employees in the same empresa
  const checkCpfDuplicate = React.useCallback(async (cpf: string) => {
    if (!cpf || cpf.length < 11) {
      setCpfWarning(null);
      return;
    }
    
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length < 11) {
      setCpfWarning(null);
      setCpfOk(false);
      return;
    }

    setIsCheckingCpf(true);
    try {
      // Get all cnpj_ids for this empresa
      const cnpjIds = cnpjsData?.map(c => c.id) || [];
      if (cnpjIds.length === 0) {
        setCpfWarning(null);
        return;
      }

      const { data: existing } = await supabase
        .from('funcionarios')
        .select('nome, cpf, status')
        .in('cnpj_id', cnpjIds)
        .or(`cpf.eq.${cleanCpf},cpf.eq.${cpf}`)
        .not('status', 'in', '("arquivado","desativado")')
        .limit(1);

      if (existing && existing.length > 0) {
        setCpfWarning(`CPF já cadastrado: ${existing[0].nome} (${existing[0].status})`);
        setCpfOk(false);
      } else {
        setCpfWarning(null);
        setCpfOk(true);
      }
    } catch {
      setCpfWarning(null);
      setCpfOk(false);
    } finally {
      setIsCheckingCpf(false);
    }
  }, [cnpjsData]);

  const onSubmit = async (data: FuncionarioFormData) => {
    // Block if CPF is duplicate
    if (cpfWarning) {
      toast.error('Não é possível cadastrar: ' + cpfWarning);
      return;
    }

    try {
      await criarFuncionario.mutateAsync({
        ...data,
        email: data.email || undefined,
        data_admissao: data.data_admissao || undefined,
        cnpj_id: data.cnpj_id,
        incluir_saude: incluirSaude,
        incluir_vida: incluirVida,
      });
      
      reset();
      setIncluirSaude(false);
      setIncluirVida(false);
      setCpfWarning(null);
      setCpfOk(false);
      setSelectedCnpjId(cnpjId || '');
      onOpenChange(false);
      onFuncionarioAdded?.();
    } catch (error: any) {
      console.error('Erro ao adicionar funcionário:', error);
      
      // Translate common DB errors to user-friendly messages
      const msg = error?.message || '';
      if (msg.includes('check_salario_positivo')) {
        toast.error('Salário deve ser maior que zero');
      } else if (msg.includes('duplicate key') || msg.includes('unique constraint') || msg.includes('cpf')) {
        toast.error('CPF já cadastrado nesta empresa');
      } else if (msg.includes('já possui um plano do tipo')) {
        toast.error(msg);
      } else {
        toast.error(msg || 'Erro ao adicionar funcionário');
      }
    }
  };

  const handleClose = () => {
    reset();
    setIncluirSaude(false);
    setIncluirVida(false);
    setCpfWarning(null);
    setCpfOk(false);
    setSelectedCnpjId(cnpjId || '');
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
            {/* Select de CNPJ - aparece apenas quando empresaId é fornecido */}
            {empresaId && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cnpj_id">CNPJ da Empresa *</Label>
                <Select 
                  value={watchedCnpjId} 
                  onValueChange={(value) => setValue('cnpj_id', value)}
                >
                  <SelectTrigger className={errors.cnpj_id ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Selecione o CNPJ..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cnpjsData?.map((cnpj) => (
                      <SelectItem key={cnpj.id} value={cnpj.id}>
                        {cnpj.razao_social} - {cnpj.cnpj}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cnpj_id && (
                  <p className="text-sm text-destructive">{errors.cnpj_id.message}</p>
                )}
              </div>
            )}

            {/* CNPJ fixo - aparece quando cnpjId é fornecido e empresaId não */}
            {cnpjId && !empresaId && (
              <input type="hidden" {...register('cnpj_id')} value={cnpjId} />
            )}

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
                  {...register('cpf', {
                    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                      let v = e.target.value.replace(/\D/g, '').slice(0, 11);
                      if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
                      else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
                      else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
                      e.target.value = v;
                      setCpfOk(false);
                      setCpfWarning(null);
                    },
                  })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={errors.cpf || cpfWarning ? 'border-destructive' : cpfOk ? 'border-green-500' : ''}
                  onBlur={(e) => checkCpfDuplicate(e.target.value)}
                />
                {isCheckingCpf && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              {errors.cpf && (
                <p className="text-sm text-destructive">{errors.cpf.message}</p>
              )}
              {cpfWarning && (
                <p className="text-sm text-destructive font-medium">⚠️ {cpfWarning}</p>
              )}
              {cpfOk && !cpfWarning && (
                <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> CPF disponível
                </p>
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
