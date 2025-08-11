
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useFuncionariosForaDoPlano } from '@/hooks/useFuncionariosForaDoPlano';
import { useAdicionarFuncionariosMutation } from '@/hooks/useAdicionarFuncionariosMutation';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: funcionarios = [], isLoading } = useFuncionariosForaDoPlano(planoId, cnpjId);
  const adicionarMutation = useAdicionarFuncionariosMutation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(funcionarios.map(f => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectFuncionario = (funcionarioId: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, funcionarioId]);
    } else {
      setSelectedIds(prev => prev.filter(id => id !== funcionarioId));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.length === 0) return;

    try {
      await adicionarMutation.mutateAsync({
        planoId,
        funcionarioIds: selectedIds
      });
      
      setSelectedIds([]);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao adicionar funcionários:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Adicionar Funcionários ao Plano - {planoSeguradora}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando funcionários...</span>
            </div>
          ) : funcionarios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Não há funcionários disponíveis para adicionar ao plano.</p>
              <p className="text-sm">Todos os funcionários ativos deste CNPJ já estão vinculados ao plano.</p>
            </div>
          ) : (
            <>
              {/* Header com seleção em massa */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedIds.length === funcionarios.length}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="font-medium">
                    Selecionar todos ({funcionarios.length} funcionários)
                  </span>
                </div>
                <Badge variant="secondary">
                  {selectedIds.length} selecionado(s)
                </Badge>
              </div>

              {/* Lista de funcionários */}
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {funcionarios.map((funcionario) => (
                    <div
                      key={funcionario.id}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedIds.includes(funcionario.id)}
                        onCheckedChange={(checked) => 
                          handleSelectFuncionario(funcionario.id, checked as boolean)
                        }
                      />
                      
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <p className="font-medium">{funcionario.nome}</p>
                          <p className="text-sm text-muted-foreground">CPF: {funcionario.cpf}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium">{funcionario.cargo}</p>
                          <p className="text-sm text-muted-foreground">
                            {funcionario.idade} anos
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(funcionario.salario)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {funcionario.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              {/* Footer com ações */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {selectedIds.length} funcionário(s) selecionado(s)
                </p>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedIds.length === 0 || adicionarMutation.isPending}
                  >
                    {adicionarMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Adicionar {selectedIds.length > 0 && `(${selectedIds.length})`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
