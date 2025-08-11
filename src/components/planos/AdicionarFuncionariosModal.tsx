
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Plus } from 'lucide-react';
import { useFuncionariosForaDoPlano } from '@/hooks/useFuncionariosForaDoPlano';
import { useAdicionarFuncionariosMutation } from '@/hooks/useAdicionarFuncionariosMutation';
import { TableLoadingState } from '@/components/ui/loading-state';
import { formatCurrency } from '@/lib/utils';

interface AdicionarFuncionariosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planoId: string;
  cnpjId: string;
  planoSeguradora: string;
}

export const AdicionarFuncionariosModal: React.FC<AdicionarFuncionariosModalProps> = ({
  open,
  onOpenChange,
  planoId,
  cnpjId,
  planoSeguradora
}) => {
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 20 });

  const { data: funcionariosData, isLoading } = useFuncionariosForaDoPlano({
    planoId,
    cnpjId,
    search: search || undefined,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  const adicionarMutation = useAdicionarFuncionariosMutation();

  const funcionarios = funcionariosData?.funcionarios || [];
  const totalCount = funcionariosData?.totalCount || 0;

  const handleSelectAll = () => {
    if (selectedIds.length === funcionarios.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(funcionarios.map(f => f.id));
    }
  };

  const handleSelectFuncionario = (funcionarioId: string) => {
    setSelectedIds(prev => 
      prev.includes(funcionarioId)
        ? prev.filter(id => id !== funcionarioId)
        : [...prev, funcionarioId]
    );
  };

  const handleAdicionarSelecionados = async () => {
    if (selectedIds.length === 0) return;

    try {
      await adicionarMutation.mutateAsync({
        planoId,
        funcionarioIds: selectedIds,
        status: 'pendente'
      });
      
      // Limpar seleção e fechar modal
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar funcionários:', error);
    }
  };

  const resetAndClose = () => {
    setSelectedIds([]);
    setSearch('');
    setPagination({ pageIndex: 0, pageSize: 20 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Funcionários ao Plano - {planoSeguradora}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Busca e Contadores */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalCount} elegíveis
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                {selectedIds.length} selecionados
              </Badge>
            </div>
          </div>

          {/* Lista de Funcionários */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <TableLoadingState rows={5} columns={3} />
            ) : funcionarios.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum funcionário elegível encontrado</p>
                <p className="text-sm">Todos os funcionários já estão no plano ou não atendem aos critérios</p>
              </div>
            ) : (
              <div className="p-4">
                {/* Header com Select All */}
                <div className="flex items-center gap-3 pb-3 border-b mb-3">
                  <Checkbox
                    checked={selectedIds.length === funcionarios.length && funcionarios.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    Selecionar todos ({funcionarios.length})
                  </span>
                </div>

                {/* Lista */}
                <div className="space-y-2">
                  {funcionarios.map((funcionario) => (
                    <div
                      key={funcionario.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleSelectFuncionario(funcionario.id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(funcionario.id)}
                        onCheckedChange={() => handleSelectFuncionario(funcionario.id)}
                      />
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">{funcionario.nome}</p>
                          <p className="text-sm text-muted-foreground">{funcionario.cpf}</p>
                        </div>
                        <div>
                          <p className="text-sm">{funcionario.cargo}</p>
                          <p className="text-sm text-muted-foreground">{funcionario.idade} anos</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(funcionario.salario)}</p>
                          <Badge variant="outline" className="text-xs">
                            {funcionario.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer com Ações */}
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {selectedIds.length} funcionário(s) selecionado(s)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAndClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleAdicionarSelecionados}
                disabled={selectedIds.length === 0 || adicionarMutation.isPending}
                className="min-w-[120px]"
              >
                {adicionarMutation.isPending ? (
                  'Adicionando...'
                ) : (
                  `Adicionar ${selectedIds.length > 0 ? `(${selectedIds.length})` : ''}`
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
