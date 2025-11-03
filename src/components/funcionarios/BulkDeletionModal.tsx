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
import { useBulkDeletion } from '@/hooks/useBulkDeletion';
import { 
  Trash2, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

interface FuncionarioParaExcluir {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  status: string;
  cnpj?: {
    id: string;
    razao_social: string;
    cnpj: string;
  };
}

interface BulkDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  funcionarios: FuncionarioParaExcluir[];
  empresaNome: string;
}

type Step = 'selection' | 'preview' | 'processing' | 'results';

export const BulkDeletionModal: React.FC<BulkDeletionModalProps> = ({
  isOpen,
  onClose,
  funcionarios,
  empresaNome
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('selection');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [filters, setFilters] = useState({
    searchTerm: '',
    cnpjId: 'all',
    statusFilter: 'all',
    cargoFilter: 'all'
  });

  const { mutate: deleteFuncionarios, isPending, data: deletionResults } = useBulkDeletion();

  // Filtrar funcionários
  const filteredFuncionarios = useMemo(() => {
    return funcionarios.filter(func => {
      if (filters.searchTerm) {
        const search = filters.searchTerm.toLowerCase();
        if (!func.nome.toLowerCase().includes(search) && 
            !func.cpf.includes(search)) {
          return false;
        }
      }
      if (filters.cnpjId !== 'all' && func.cnpj?.id !== filters.cnpjId) return false;
      if (filters.statusFilter !== 'all' && func.status !== filters.statusFilter) return false;
      if (filters.cargoFilter !== 'all' && func.cargo !== filters.cargoFilter) return false;
      return true;
    });
  }, [funcionarios, filters]);

  // Cálculos
  const selectedFuncionarios = funcionarios.filter(f => selectedIds.has(f.id));
  const hasAtivos = selectedFuncionarios.some(f => f.status === 'ativo');
  const uniqueCnpjs = [...new Set(funcionarios.map(f => f.cnpj?.id).filter(Boolean))];
  const uniqueCargos = [...new Set(funcionarios.map(f => f.cargo))];

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredFuncionarios.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredFuncionarios.map(f => f.id)));
    }
  };

  const handleSelectFuncionario = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleConfirmDeletion = () => {
    deleteFuncionarios(
      { funcionarioIds: Array.from(selectedIds) },
      {
        onSuccess: () => {
          setCurrentStep('results');
        }
      }
    );
    setCurrentStep('processing');
  };

  const resetModal = () => {
    setCurrentStep('selection');
    setSelectedIds(new Set());
    setConfirmationChecked(false);
    setFilters({ searchTerm: '', cnpjId: 'all', statusFilter: 'all', cargoFilter: 'all' });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  // Colunas da tabela
  const columns: ColumnDef<FuncionarioParaExcluir>[] = [
    {
      id: 'select',
      header: () => (
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
    },
    {
      accessorKey: 'cpf',
      header: 'CPF',
    },
    {
      accessorKey: 'cargo',
      header: 'Cargo',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge variant={status === 'ativo' ? 'default' : 'secondary'}>
            {status}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => row.original.cnpj?.razao_social || '-'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Exclusão em Massa de Funcionários
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {empresaNome} • {funcionarios.length} funcionários disponíveis
          </p>
        </DialogHeader>

        {/* Step 1: Selection */}
        {currentStep === 'selection' && (
          <div className="space-y-4">
            {/* Filtros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Input
                    placeholder="Buscar nome/CPF..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                  />
                  <Select value={filters.cnpjId} onValueChange={(v) => setFilters({...filters, cnpjId: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os CNPJs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueCnpjs.map(id => {
                        const cnpj = funcionarios.find(f => f.cnpj?.id === id)?.cnpj;
                        return (
                          <SelectItem key={id} value={id!}>
                            {cnpj?.razao_social}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Select value={filters.statusFilter} onValueChange={(v) => setFilters({...filters, statusFilter: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filters.cargoFilter} onValueChange={(v) => setFilters({...filters, cargoFilter: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os cargos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueCargos.map(cargo => (
                        <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <Badge variant="secondary">
                    {filteredFuncionarios.length} de {funcionarios.length} funcionários
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFilters({ searchTerm: '', cnpjId: 'all', statusFilter: 'all', cargoFilter: 'all' })}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Warnings */}
            {hasAtivos && selectedIds.size > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Atenção: Você selecionou funcionários com status "ativo". Eles podem ter planos ativos vinculados.
                </AlertDescription>
              </Alert>
            )}

            {selectedIds.size > 50 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Você selecionou mais de 50 funcionários. Esta operação pode demorar alguns minutos.
                </AlertDescription>
              </Alert>
            )}

            {/* Tabela */}
            <DataTable
              columns={columns}
              data={filteredFuncionarios}
            />

            {/* Botões */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setCurrentStep('preview')}
                disabled={selectedIds.size === 0}
              >
                Continuar ({selectedIds.size} selecionados)
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {currentStep === 'preview' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>ATENÇÃO:</strong> Você está prestes a excluir <strong>{selectedIds.size} funcionário(s)</strong>.
                Esta ação é <strong>IRREVERSÍVEL</strong>.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle>Funcionários que serão excluídos:</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 max-h-60 overflow-y-auto">
                  {selectedFuncionarios.map(f => (
                    <li key={f.id} className="text-sm">
                      {f.nome} - {f.cpf} ({f.status})
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm"
                checked={confirmationChecked}
                onCheckedChange={(checked) => setConfirmationChecked(checked as boolean)}
              />
              <label htmlFor="confirm" className="text-sm font-medium">
                Entendo que esta ação é irreversível e confirmo a exclusão
              </label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setCurrentStep('selection')}>
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeletion}
                disabled={!confirmationChecked || isPending}
              >
                {isPending ? 'Excluindo...' : `Excluir ${selectedIds.size} Funcionários`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Processing */}
        {currentStep === 'processing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center flex-col gap-4 py-8">
              <Clock className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Processando exclusões...</p>
              <Progress value={undefined} className="w-full max-w-md" />
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 'results' && deletionResults && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Excluídos</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {deletionResults.success.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <div>
                      <p className="text-sm text-muted-foreground">Erros</p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {deletionResults.errors.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {deletionResults.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive">Erros Encontrados</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {deletionResults.errors.map((err, idx) => (
                      <li key={idx}>{err.error}</li>
                    ))}
                  </ul>
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
      </DialogContent>
    </Dialog>
  );
};
