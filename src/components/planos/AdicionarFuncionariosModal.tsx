import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Users, Plus } from 'lucide-react';
import { useFuncionariosForaDoPlano } from '@/hooks/useFuncionariosForaDoPlano';
import { useAdicionarFuncionariosMutation } from '@/hooks/useAdicionarFuncionariosMutation';
import { Badge } from '@/components/ui/badge';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';

interface AdicionarFuncionariosModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planoId: string;
  cnpjId: string;
  planoSeguradora: string;
  tipoSeguro?: string;
}

export const AdicionarFuncionariosModal: React.FC<AdicionarFuncionariosModalProps> = ({
  open,
  onOpenChange,
  planoId,
  cnpjId,
  planoSeguradora,
  tipoSeguro = 'vida'
}) => {
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: funcionarios, isLoading } = useFuncionariosForaDoPlano(planoId, cnpjId);
  const adicionarFuncionarios = useAdicionarFuncionariosMutation();

  // Filtrar funcionários baseado na busca
  const funcionariosFiltrados = funcionarios?.filter(f => 
    f.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.cpf.includes(searchTerm) ||
    f.cargo.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleSelectFuncionario = (funcionarioId: string) => {
    setSelectedFuncionarios(prev => 
      prev.includes(funcionarioId)
        ? prev.filter(id => id !== funcionarioId)
        : [...prev, funcionarioId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFuncionarios.length === funcionariosFiltrados.length) {
      setSelectedFuncionarios([]);
    } else {
      setSelectedFuncionarios(funcionariosFiltrados.map(f => f.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedFuncionarios.length === 0) return;

    console.log('🚀 Submetendo adição de funcionários:', {
      planoId,
      tipoSeguro,
      funcionarioIds: selectedFuncionarios
    });

    try {
      await adicionarFuncionarios.mutateAsync({
        planoId,
        tipoSeguro,
        funcionarioIds: selectedFuncionarios
      });
      
      // Resetar estado e fechar modal
      setSelectedFuncionarios([]);
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar funcionários:', error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Funcionários ao Plano {tipoSeguro === 'vida' ? 'de Vida' : 'de Saúde'}
          </DialogTitle>
          <DialogDescription>
            Selecione os funcionários que deseja adicionar ao plano da {planoSeguradora}.
            Funcionários já vinculados a este plano não aparecem na lista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Controles de seleção */}
          {funcionariosFiltrados.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedFuncionarios.length === funcionariosFiltrados.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">
                  Selecionar todos ({funcionariosFiltrados.length})
                </span>
              </div>
              <Badge variant="secondary">
                {selectedFuncionarios.length} selecionado(s)
              </Badge>
            </div>
          )}

          {/* Lista de funcionários */}
          <ScrollArea className="flex-1 border rounded-lg min-h-[200px]">
            {isLoading ? (
              <div className="p-8">
                <DashboardLoadingState />
              </div>
            ) : funcionariosFiltrados.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={Users}
                  title="Nenhum funcionário disponível"
                  description={
                    funcionarios?.length === 0 
                      ? "Todos os funcionários já estão vinculados a este plano ou não há funcionários cadastrados."
                      : "Nenhum funcionário encontrado com os critérios de busca."
                  }
                />
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {funcionariosFiltrados.map((funcionario) => (
                  <div
                    key={funcionario.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedFuncionarios.includes(funcionario.id)}
                      onCheckedChange={() => handleSelectFuncionario(funcionario.id)}
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                      <div>
                        <p className="font-medium">{funcionario.nome}</p>
                        <p className="text-sm text-muted-foreground">{funcionario.cpf}</p>
                      </div>
                      <div>
                        <p className="text-sm">{funcionario.cargo}</p>
                        <p className="text-sm text-muted-foreground">{funcionario.idade} anos</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(funcionario.salario)}
                        </p>
                      </div>
                      <div>
                        <Badge variant="outline" className="text-xs">
                          {funcionario.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Ações */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adicionarFuncionarios.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFuncionarios.length === 0 || adicionarFuncionarios.isPending}
              className="min-w-32"
            >
              {adicionarFuncionarios.isPending ? 'Adicionando...' : `Adicionar ${selectedFuncionarios.length} funcionário(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
