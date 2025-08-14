import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Users, 
  Filter, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Building2,
  DollarSign,
  Clock,
  Info
} from 'lucide-react';

interface FuncionarioPendente {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  data_nascimento: string;
  data_admissao: string;
  departamento?: string;
  idade: number;
  tempo_empresa_dias: number;
}

interface BulkActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionarios: FuncionarioPendente[];
  plano: {
    id: string;
    seguradora: string;
    valor_mensal: number;
    empresa_nome: string;
  };
}

interface FilterConfig {
  searchTerm: string;
  departamento: string;
  cargoFilter: string;
  idadeMin: string;
  idadeMax: string;
  salarioMin: string;
  salarioMax: string;
  tempoEmpresaMin: string;
}

type Step = 'selection' | 'preview' | 'processing' | 'results';

export const BulkActivationModal: React.FC<BulkActivationModalProps> = ({
  isOpen,
  onClose,
  funcionarios,
  plano
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<FilterConfig>({
    searchTerm: '',
    departamento: '',
    cargoFilter: '',
    idadeMin: '',
    idadeMax: '',
    salarioMin: '',
    salarioMax: '',
    tempoEmpresaMin: ''
  });
  const [activationResults, setActivationResults] = useState<{
    success: string[];
    errors: { id: string; error: string }[];
  } | null>(null);

  const queryClient = useQueryClient();

  // Bulk activation mutation
  const bulkActivationMutation = useMutation({
    mutationFn: async (funcionarioIds: string[]) => {
      const promises = funcionarioIds.map(async (id) => {
        try {
          const { error } = await supabase
            .from('funcionarios')
            .update({
              status: 'ativo',
              updated_at: new Date().toISOString()
            })
            .eq('id', id);

          if (error) throw error;
          return { id, success: true };
        } catch (error: any) {
          return { id, success: false, error: error.message };
        }
      });

      const results = await Promise.all(promises);
      
      const success = results.filter(r => r.success).map(r => r.id);
      const errors = results.filter(r => !r.success).map(r => ({ 
        id: r.id, 
        error: r.error || 'Erro desconhecido' 
      }));

      return { success, errors };
    },
    onSuccess: (results) => {
      setActivationResults(results);
      setCurrentStep('results');
      
      if (results.success.length > 0) {
        toast.success(`${results.success.length} funcionário(s) ativado(s) com sucesso!`);
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
        queryClient.invalidateQueries({ queryKey: ['plano-detalhes'] });
        queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
        queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      }
      
      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} funcionário(s) não foram ativados devido a erros`);
      }
    },
    onError: (error: any) => {
      toast.error('Erro durante a ativação em massa: ' + error.message);
      setCurrentStep('selection');
    }
  });

  // Filter funcionarios based on current filters
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(funcionario => {
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matches = 
          funcionario.nome.toLowerCase().includes(searchLower) ||
          funcionario.cpf.includes(filters.searchTerm) ||
          funcionario.cargo.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      // Department filter
      if (filters.departamento && funcionario.departamento !== filters.departamento) {
        return false;
      }

      // Cargo filter
      if (filters.cargoFilter && funcionario.cargo !== filters.cargoFilter) {
        return false;
      }

      // Age filters
      if (filters.idadeMin && funcionario.idade < parseInt(filters.idadeMin)) {
        return false;
      }
      if (filters.idadeMax && funcionario.idade > parseInt(filters.idadeMax)) {
        return false;
      }

      // Salary filters
      if (filters.salarioMin && funcionario.salario < parseFloat(filters.salarioMin)) {
        return false;
      }
      if (filters.salarioMax && funcionario.salario > parseFloat(filters.salarioMax)) {
        return false;
      }

      // Company time filter
      if (filters.tempoEmpresaMin && funcionario.tempo_empresa_dias < parseInt(filters.tempoEmpresaMin)) {
        return false;
      }

      return true;
    });
  }, [funcionarios, filters]);

  // Get unique values for select filters
  const uniqueDepartamentos = [...new Set(funcionarios.map(f => f.departamento).filter(Boolean))];
  const uniqueCargos = [...new Set(funcionarios.map(f => f.cargo))];

  // Handle select/deselect all
  const handleSelectAll = () => {
    if (selectedIds.size === filteredFuncionarios.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFuncionarios.map(f => f.id)));
    }
  };

  // Handle individual selection
  const handleSelectFuncionario = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Calculate financial impact
  const selectedFuncionarios = funcionarios.filter(f => selectedIds.has(f.id));
  const impactoFinanceiro = selectedFuncionarios.length * plano.valor_mensal;

  // Reset modal state
  const resetModal = () => {
    setCurrentStep('selection');
    setSelectedIds(new Set());
    setFilters({
      searchTerm: '',
      departamento: '',
      cargoFilter: '',
      idadeMin: '',
      idadeMax: '',
      salarioMin: '',
      salarioMax: '',
      tempoEmpresaMin: ''
    });
    setActivationResults(null);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Table columns for selection step
  const selectionColumns: ColumnDef<FuncionarioPendente>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={selectedIds.size === filteredFuncionarios.length && filteredFuncionarios.length > 0}
          onCheckedChange={handleSelectAll}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedIds.has(row.original.id)}
          onCheckedChange={() => handleSelectFuncionario(row.original.id)}
        />
      ),
    },
    {
      accessorKey: 'nome',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('nome')}</div>
      ),
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
    },
    {
      accessorKey: 'departamento',
      header: 'Departamento',
      cell: ({ row }) => (
        <div>{row.getValue('departamento') || '-'}</div>
      ),
    },
    {
      accessorKey: 'idade',
      header: 'Idade',
      cell: ({ row }) => (
        <div className="text-center">{row.getValue('idade')} anos</div>
      ),
    },
    {
      accessorKey: 'salario',
      header: 'Salário',
      cell: ({ row }) => (
        <div className="font-medium">
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(row.getValue('salario'))}
        </div>
      ),
    },
    {
      accessorKey: 'tempo_empresa_dias',
      header: 'Tempo na Empresa',
      cell: ({ row }) => {
        const dias = row.getValue('tempo_empresa_dias') as number;
        const anos = Math.floor(dias / 365);
        const meses = Math.floor((dias % 365) / 30);
        return (
          <div className="text-sm">
            {anos > 0 && `${anos}a `}
            {meses > 0 && `${meses}m`}
            {anos === 0 && meses === 0 && `${dias}d`}
          </div>
        );
      },
    },
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Ativação em Massa de Funcionários
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {plano.empresa_nome} • {plano.seguradora} • {funcionarios.length} funcionários pendentes
          </p>
        </DialogHeader>

        {/* Step Progress */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[
            { key: 'selection', label: 'Seleção', icon: Filter },
            { key: 'preview', label: 'Confirmação', icon: Eye },
            { key: 'processing', label: 'Processamento', icon: Clock },
            { key: 'results', label: 'Resultados', icon: CheckCircle2 }
          ].map((step, index) => (
            <div key={step.key} className="flex items-center">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center
                ${currentStep === step.key ? 'bg-primary text-primary-foreground' : 
                  ['preview', 'processing', 'results'].includes(currentStep) && 
                  ['selection'].includes(step.key) ||
                  ['processing', 'results'].includes(currentStep) && 
                  ['selection', 'preview'].includes(step.key) ||
                  currentStep === 'results' && step.key === 'processing'
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-muted text-muted-foreground'
                }
              `}>
                <step.icon className="h-4 w-4" />
              </div>
              <span className="ml-2 text-sm">{step.label}</span>
              {index < 3 && <div className="h-px w-8 bg-border ml-4" />}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="mt-6">
          {/* Selection Step */}
          {currentStep === 'selection' && (
            <div className="space-y-6">
              {/* Filters */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Filtros Inteligentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="text-sm font-medium">Buscar</label>
                      <Input
                        placeholder="Nome, CPF ou cargo..."
                        value={filters.searchTerm}
                        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Departamento</label>
                      <Select value={filters.departamento} onValueChange={(value) => setFilters({...filters, departamento: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {uniqueDepartamentos.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Cargo</label>
                      <Select value={filters.cargoFilter} onValueChange={(value) => setFilters({...filters, cargoFilter: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Todos</SelectItem>
                          {uniqueCargos.map(cargo => (
                            <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium">Idade</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Min"
                          type="number"
                          value={filters.idadeMin}
                          onChange={(e) => setFilters({...filters, idadeMin: e.target.value})}
                        />
                        <Input
                          placeholder="Max"
                          type="number"
                          value={filters.idadeMax}
                          onChange={(e) => setFilters({...filters, idadeMax: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <Badge variant="secondary">
                      {filteredFuncionarios.length} de {funcionarios.length} funcionários
                    </Badge>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFilters({
                        searchTerm: '',
                        departamento: '',
                        cargoFilter: '',
                        idadeMin: '',
                        idadeMax: '',
                        salarioMin: '',
                        salarioMax: '',
                        tempoEmpresaMin: ''
                      })}
                    >
                      Limpar Filtros
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Selection Summary */}
              {selectedIds.size > 0 && (
                <Card className="border-primary bg-primary/5">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">
                            {selectedIds.size} funcionário(s) selecionado(s)
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Impacto mensal: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(impactoFinanceiro)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="h-4 w-4" />
                            Receita anual projetada: {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(impactoFinanceiro * 12)}
                          </div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => setCurrentStep('preview')}
                        disabled={selectedIds.size === 0}
                      >
                        Continuar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Table */}
              <DataTable
                columns={selectionColumns}
                data={filteredFuncionarios}
                isLoading={false}
              />
            </div>
          )}

          {/* Preview Step */}
          {currentStep === 'preview' && (
            <div className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Confirme os funcionários que serão ativados. Esta ação não pode ser desfeita.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Users className="h-5 w-5" />
                      Resumo da Ativação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-2xl font-bold text-primary">{selectedIds.size}</div>
                      <div className="text-sm text-muted-foreground">Funcionários a ativar</div>
                    </div>
                    
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(impactoFinanceiro)}
                      </div>
                      <div className="text-sm text-muted-foreground">Impacto mensal</div>
                    </div>

                    <div>
                      <div className="text-lg font-semibold text-blue-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(impactoFinanceiro * 12)}
                      </div>
                      <div className="text-sm text-muted-foreground">Receita anual projetada</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Funcionários Selecionados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {selectedFuncionarios.map(funcionario => (
                        <div key={funcionario.id} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <div className="font-medium">{funcionario.nome}</div>
                            <div className="text-sm text-muted-foreground">{funcionario.cargo}</div>
                          </div>
                          <Badge variant="outline">{funcionario.idade} anos</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep('selection')}>
                  Voltar
                </Button>
                <Button 
                  onClick={() => {
                    setCurrentStep('processing');
                    bulkActivationMutation.mutate(Array.from(selectedIds));
                  }}
                  disabled={selectedIds.size === 0}
                >
                  Ativar {selectedIds.size} Funcionário(s)
                </Button>
              </div>
            </div>
          )}

          {/* Processing Step */}
          {currentStep === 'processing' && (
            <div className="space-y-6 text-center py-12">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-8 w-8 text-primary animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Ativando funcionários...</h3>
                <p className="text-sm text-muted-foreground">
                  Processando {selectedIds.size} funcionário(s)
                </p>
              </div>
              <div className="max-w-md mx-auto">
                <Progress value={bulkActivationMutation.isPending ? 50 : 100} className="w-full" />
              </div>
            </div>
          )}

          {/* Results Step */}
          {currentStep === 'results' && activationResults && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activationResults.success.length > 0 && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                        Ativações Bem-sucedidas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-700 mb-2">
                        {activationResults.success.length}
                      </div>
                      <div className="text-sm text-green-600">
                        Funcionários ativados com sucesso
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activationResults.errors.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="h-5 w-5" />
                        Erros na Ativação
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-700 mb-2">
                        {activationResults.errors.length}
                      </div>
                      <div className="text-sm text-red-600">
                        Funcionários não ativados
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {activationResults.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhes dos Erros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {activationResults.errors.map((error, index) => {
                        const funcionario = funcionarios.find(f => f.id === error.id);
                        return (
                          <div key={index} className="p-2 bg-red-50 border border-red-200 rounded">
                            <div className="font-medium text-red-700">
                              {funcionario?.nome || 'Funcionário não encontrado'}
                            </div>
                            <div className="text-sm text-red-600">{error.error}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
