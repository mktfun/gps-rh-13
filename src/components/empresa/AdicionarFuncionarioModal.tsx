
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useCnpjOptions } from '@/hooks/useCnpjOptions';
import { toast } from 'sonner';
import { Loader2, Heart, Cross } from 'lucide-react';
import { useEffect } from 'react';

const funcionarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 dígitos').max(14, 'CPF inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  cnpj_id: z.string().min(1, 'CNPJ da empresa é obrigatório'),
  data_admissao: z.string().min(1, 'Data de admissão é obrigatória'),
  cargo: z.string().min(2, 'Cargo deve ter pelo menos 2 caracteres'),
  salario: z.number().min(0, 'Salário deve ser maior que zero'),
  estado_civil: z.enum(['solteiro', 'casado', 'divorciado', 'viuvo']),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
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
  const [incluirSaude, setIncluirSaude] = useState(false);
  const [incluirVida, setIncluirVida] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedCnpjId, setSelectedCnpjId] = useState<string>(cnpjId || '');
  
  // Buscar CNPJs se empresaId for fornecido
  const { data: cnpjsData } = empresaId ? useCnpjOptions() : { data: undefined };
  
  const { data: planosDisponiveis = [] } = usePlanosDisponiveis(selectedCnpjId || cnpjId);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FuncionarioFormData>({
    resolver: zodResolver(funcionarioSchema),
    defaultValues: {
      nome: '',
      cpf: '',
      data_nascimento: '',
      cnpj_id: cnpjId || '',
      data_admissao: '',
      cargo: '',
      salario: 0,
      estado_civil: 'solteiro',
      email: '',
    },
  });

  // Atualizar selectedCnpjId quando o valor do formulário mudar
  const watchCnpjId = watch('cnpj_id');
  useEffect(() => {
    if (watchCnpjId && watchCnpjId !== selectedCnpjId) {
      setSelectedCnpjId(watchCnpjId);
    }
  }, [watchCnpjId, selectedCnpjId]);

  const estadoCivil = watch('estado_civil');

  const onSubmit = async (data: FuncionarioFormData) => {
    try {
      await criarFuncionario.mutateAsync({
        ...data,
        email: data.email || undefined,
        data_admissao: data.data_admissao || undefined,
        cnpj_id: data.cnpj_id || cnpjId,
        incluir_saude: incluirSaude,
        incluir_vida: incluirVida,
      });
      
      reset();
      setIncluirSaude(false);
      setIncluirVida(false);
      setStep(1);
      setSelectedCnpjId(cnpjId || '');
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
    setStep(1);
    setSelectedCnpjId(cnpjId || '');
    onOpenChange(false);
  };

  const handleNext = async () => {
    const isValid = await trigger(['nome', 'cpf', 'data_nascimento', 'cnpj_id']);
    if (isValid) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const planoSaude = planosDisponiveis.find(p => p.tipo_seguro === 'saude');
  const planoVida = planosDisponiveis.find(p => p.tipo_seguro === 'vida');

  // Watch step 1 fields to enable/disable Next button
  const step1Fields = watch(['nome', 'cpf', 'data_nascimento', 'cnpj_id']);
  const isStep1Valid = step1Fields.every(field => field && field !== '');

  // Animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? '-100%' : '100%',
      opacity: 0,
    }),
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Novo Funcionário</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Passo {step} de 2: {step === 1 ? 'Identificação do Funcionário' : 'Detalhes do Contrato'}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative overflow-hidden min-h-[400px]">
            <AnimatePresence initial={false} custom={step}>
              {step === 1 && (
                <motion.div
                  key="step1"
                  custom={1}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="absolute w-full space-y-4"
                >
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

                    {/* Se empresaId for fornecido, mostrar Select de CNPJ */}
                    {empresaId && (
                      <div className="space-y-2">
                        <Label htmlFor="cnpj_id">CNPJ da Empresa *</Label>
                        <Select 
                          value={watch('cnpj_id')} 
                          onValueChange={(value) => setValue('cnpj_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o CNPJ" />
                          </SelectTrigger>
                          <SelectContent>
                            {cnpjsData?.map((cnpj) => (
                              <SelectItem key={cnpj.value} value={cnpj.value}>
                                {cnpj.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.cnpj_id && (
                          <p className="text-sm text-destructive">{errors.cnpj_id.message}</p>
                        )}
                      </div>
                    )}
                    
                    {/* Se cnpjId fixo for fornecido, mostrar campo disabled */}
                    {cnpjId && !empresaId && (
                      <div className="space-y-2">
                        <Label htmlFor="cnpj_id">CNPJ da Empresa</Label>
                        <Input
                          id="cnpj_id"
                          {...register('cnpj_id')}
                          value={cnpjId}
                          disabled
                          className="bg-muted"
                        />
                        {errors.cnpj_id && (
                          <p className="text-sm text-destructive">{errors.cnpj_id.message}</p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  custom={2}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'tween', duration: 0.3 }}
                  className="absolute w-full space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div className="space-y-2">
                      <Label htmlFor="data_admissao">Data de Admissão *</Label>
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

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="email">E-mail (opcional)</Label>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex justify-between gap-2 pt-4">
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={!isStep1Valid}
                >
                  Próximo
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Funcionário
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
