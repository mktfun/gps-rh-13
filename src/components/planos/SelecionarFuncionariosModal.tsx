import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAdicionarFuncionariosPlano } from '@/hooks/useAdicionarFuncionariosPlano';

interface FuncionarioDisponivel {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  data_nascimento: string;
  email?: string;
  status: string;
  estado_civil?: string;
  data_admissao: string;
}

interface SelecionarFuncionariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  cnpjId: string;
  planoId: string;
  onFuncionariosAdicionados?: () => void;
}

export const SelecionarFuncionariosModal: React.FC<SelecionarFuncionariosModalProps> = ({
  isOpen,
  onClose,
  cnpjId,
  planoId,
  onFuncionariosAdicionados
}) => {
  const [selectedFuncionarios, setSelectedFuncionarios] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar funcionários disponíveis do CNPJ que não estão no plano
  const { data: funcionariosDisponiveis, isLoading } = useQuery({
    queryKey: ['funcionarios-disponiveis', cnpjId, planoId],
    queryFn: async (): Promise<FuncionarioDisponivel[]> => {
      if (!cnpjId || !planoId) {
        console.log('📝 Missing required IDs:', { cnpjId, planoId });
        return [];
      }

      // Clean and validate UUID format to prevent injection
      const cleanCnpjId = cnpjId.trim();
      const cleanPlanoId = planoId.trim();

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(cleanCnpjId) || !uuidRegex.test(cleanPlanoId)) {
        console.error('❌ Invalid UUID format:', {
          cnpjId: cleanCnpjId,
          planoId: cleanPlanoId,
          cnpjIdLength: cleanCnpjId.length,
          planoIdLength: cleanPlanoId.length,
          cnpjIdBytes: [...cleanCnpjId].map(c => c.charCodeAt(0)),
          planoIdBytes: [...cleanPlanoId].map(c => c.charCodeAt(0))
        });
        throw new Error('IDs inválidos fornecidos');
      }

      console.log('✅ Valid UUIDs:', { cnpjId: cleanCnpjId, planoId: cleanPlanoId });

      // First get funcionarios IDs that are already in this plan
      const { data: funcionariosNoPlano, error: errorPlano } = await supabase
        .from('planos_funcionarios')
        .select('funcionario_id')
        .eq('plano_id', cleanPlanoId);

      if (errorPlano) {
        console.error('❌ Erro ao buscar funcionários do plano:', errorPlano);
        console.error('Query details:', { planoId: cleanPlanoId, table: 'planos_funcionarios' });
        throw new Error(`Erro ao buscar funcionários do plano: ${errorPlano.message}`);
      }

      const funcionarioIdsNoPlano = funcionariosNoPlano?.map(pf => pf.funcionario_id) || [];

      // Get all funcionários from CNPJ
      const { data: allFuncionarios, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('cnpj_id', cleanCnpjId)
        .in('status', ['ativo', 'pendente']);

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        throw new Error('Erro ao buscar funcionários');
      }

      // Filter out funcionários that are already in this plan
      const data = allFuncionarios?.filter(funcionario =>
        !funcionarioIdsNoPlano.includes(funcionario.id)
      ) || [];

      if (error) {
        console.error('Erro ao buscar funcionários disponíveis:', error);
        throw new Error('Erro ao buscar funcionários disponíveis');
      }

      return (data || []).map(funcionario => ({
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        cargo: funcionario.cargo,
        salario: funcionario.salario || 0,
        idade: funcionario.idade || 0,
        data_nascimento: funcionario.data_nascimento,
        email: funcionario.email,
        status: funcionario.status,
        estado_civil: funcionario.estado_civil,
        data_admissao: funcionario.created_at
      }));
    },
    enabled: !!cnpjId && !!planoId && isOpen,
  });

  const { mutateAsync: adicionarFuncionarios, isPending } = useAdicionarFuncionariosPlano();

  // Filtrar funcionários baseado na busca
  const funcionariosFiltrados = useMemo(() => {
    if (!funcionariosDisponiveis) return [];
    
    if (!searchTerm) return funcionariosDisponiveis;
    
    const termo = searchTerm.toLowerCase();
    return funcionariosDisponiveis.filter(funcionario =>
      funcionario.nome.toLowerCase().includes(termo) ||
      funcionario.cpf.includes(termo) ||
      funcionario.cargo.toLowerCase().includes(termo)
    );
  }, [funcionariosDisponiveis, searchTerm]);

  const handleSelectAll = () => {
    if (selectedFuncionarios.length === funcionariosFiltrados.length) {
      setSelectedFuncionarios([]);
    } else {
      setSelectedFuncionarios(funcionariosFiltrados.map(f => f.id));
    }
  };

  const handleSelectFuncionario = (funcionarioId: string) => {
    setSelectedFuncionarios(prev => 
      prev.includes(funcionarioId)
        ? prev.filter(id => id !== funcionarioId)
        : [...prev, funcionarioId]
    );
  };

  const handleSubmit = async () => {
    if (selectedFuncionarios.length === 0) {
      toast.error('Selecione pelo menos um funcionário');
      return;
    }

    try {
      await adicionarFuncionarios({
        plano_id: planoId,
        funcionarios_ids: selectedFuncionarios
      });

      toast.success(`${selectedFuncionarios.length} funcionário(s) adicionado(s) com sucesso!`);
      onFuncionariosAdicionados?.();
      handleClose();
    } catch (error) {
      console.error('Erro ao adicionar funcionários:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  };

  const handleClose = () => {
    setSelectedFuncionarios([]);
    setSearchTerm('');
    onClose();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'ativo' ? 'default' : 'secondary';
    const label = status === 'ativo' ? 'Ativo' : 'Pendente';
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Selecionar Funcionários para o Plano
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Barra de pesquisa */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou cargo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {funcionariosFiltrados.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSelectAll}
                className="whitespace-nowrap"
              >
                {selectedFuncionarios.length === funcionariosFiltrados.length 
                  ? 'Desmarcar Todos' 
                  : 'Selecionar Todos'
                }
              </Button>
            )}
          </div>

          {/* Contador de selecionados */}
          {selectedFuncionarios.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserCheck className="h-4 w-4" />
              {selectedFuncionarios.length} funcionário(s) selecionado(s)
            </div>
          )}

          {/* Tabela de funcionários */}
          <div className="border rounded-lg">
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Carregando funcionários...</p>
                  </div>
                </div>
              ) : funcionariosFiltrados.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhum funcionário disponível</h3>
                    <p className="text-muted-foreground">
                      {funcionariosDisponiveis?.length === 0 
                        ? 'Todos os funcionários deste CNPJ já estão vinculados ao plano.'
                        : 'Nenhum funcionário encontrado com os filtros aplicados.'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedFuncionarios.length === funcionariosFiltrados.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Idade</TableHead>
                      <TableHead>Salário</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Admissão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionariosFiltrados.map((funcionario) => (
                      <TableRow key={funcionario.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedFuncionarios.includes(funcionario.id)}
                            onCheckedChange={() => handleSelectFuncionario(funcionario.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{funcionario.nome}</TableCell>
                        <TableCell className="font-mono text-sm">{funcionario.cpf}</TableCell>
                        <TableCell>{funcionario.cargo}</TableCell>
                        <TableCell>{funcionario.idade} anos</TableCell>
                        <TableCell>{formatCurrency(funcionario.salario)}</TableCell>
                        <TableCell>{getStatusBadge(funcionario.status)}</TableCell>
                        <TableCell>{formatDate(funcionario.data_admissao)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedFuncionarios.length === 0 || isPending}
          >
            {isPending 
              ? 'Adicionando...' 
              : `Adicionar ${selectedFuncionarios.length} funcionário(s)`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
