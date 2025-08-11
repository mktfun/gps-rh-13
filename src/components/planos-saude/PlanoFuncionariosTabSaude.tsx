
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  UserCheck, 
  Clock, 
  AlertTriangle,
  Stethoscope
} from 'lucide-react';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { AddFuncionarioModal } from '@/components/seguros-vida/AddFuncionarioModal';
import { toast } from 'sonner';

interface PlanoFuncionariosTabSaudeProps {
  cnpjId: string;
  plano: {
    id: string;
    seguradora: string;
    valor_mensal: number;
  };
  shouldOpenAddModal?: boolean;
  onAddModalHandled?: () => void;
}

export const PlanoFuncionariosTabSaude = ({ 
  cnpjId, 
  plano, 
  shouldOpenAddModal = false,
  onAddModalHandled 
}: PlanoFuncionariosTabSaudeProps) => {
  const [statusFilter, setStatusFilter] = useState<string>('todos'); // PADRÃO: 'todos'
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(shouldOpenAddModal);
  const pageSize = 10;

  console.log('🔍 PlanoFuncionariosTabSaude - Usando plano:', plano);

  // Usar o planoId diretamente
  const { 
    data: funcionariosData, 
    isLoading, 
    error,
    updateFuncionario,
    deleteFuncionario
  } = usePlanoFuncionarios({
    planoId: plano.id, // USAR O PLANO ID DIRETO
    statusFilter: statusFilter === 'todos' ? undefined : statusFilter,
    search,
    pageIndex: currentPage,
    pageSize
  });

  const { data: stats } = usePlanoFuncionariosStats({
    planoId: plano.id, // USAR O PLANO ID DIRETO
    valorMensal: plano.valor_mensal
  });

  console.log('✅ PlanoFuncionariosTabSaude - Dados carregados:', {
    planoId: plano.id,
    totalCount: funcionariosData?.totalCount,
    funcionarios: funcionariosData?.funcionarios?.length,
    stats,
    statusFilter
  });

  const handleAtivarFuncionario = async (funcionarioId: string) => {
    try {
      await updateFuncionario.mutateAsync({
        funcionario_id: funcionarioId,
        status: 'ativo',
        plano_id_override: plano.id
      });
      toast.success('Funcionário ativado no plano de saúde com sucesso!');
    } catch (error) {
      console.error('Erro ao ativar funcionário no plano de saúde:', error);
      toast.error('Erro ao ativar funcionário no plano de saúde');
    }
  };

  const handleRemoverFuncionario = async (funcionarioId: string) => {
    try {
      await deleteFuncionario.mutateAsync(funcionarioId);
    } catch (error) {
      console.error('Erro ao remover funcionário do plano de saúde:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats?.ativos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats?.pendentes || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{stats?.inativos || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats?.total || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5" />
              Funcionários do Plano de Saúde ({funcionariosData?.totalCount || 0})
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Funcionário
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
                <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FuncionariosPlanoDataTable
            data={funcionariosData?.funcionarios || []}
            isLoading={isLoading}
            totalCount={funcionariosData?.totalCount || 0}
            currentPage={currentPage}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onAtivarFuncionario={handleAtivarFuncionario}
            onRemoverFuncionario={handleRemoverFuncionario}
            isUpdating={updateFuncionario.isPending || deleteFuncionario.isPending}
            tipoSeguro="saude"
          />
        </CardContent>
      </Card>

      <AddFuncionarioModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open && onAddModalHandled) {
            onAddModalHandled();
          }
        }}
        cnpjId={cnpjId}
      />
    </div>
  );
};
