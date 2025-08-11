
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';
import { AdicionarFuncionarioModal } from '@/components/empresa/AdicionarFuncionarioModal';
import type { PlanoDetalhes } from '@/types/planos';

interface FuncionariosTabProps {
  plano: PlanoDetalhes;
}

export const FuncionariosTab: React.FC<FuncionariosTabProps> = ({ plano }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // PADRÃO: 'todos'
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [addModalOpen, setAddModalOpen] = useState(false);

  console.log('🔍 FuncionariosTab - Plano recebido:', plano);

  // Usar o planoId diretamente do plano
  const { data: funcionariosData, isLoading } = usePlanoFuncionarios({
    planoId: plano.id, // USAR O PLANO ID DIRETO
    statusFilter: statusFilter === 'todos' ? undefined : statusFilter,
    search: search || undefined,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  // Buscar estatísticas usando planoId diretamente
  const { data: stats } = usePlanoFuncionariosStats({
    planoId: plano.id, // USAR O PLANO ID DIRETO
    valorMensal: plano.valor_mensal
  });

  const funcionarios = funcionariosData?.funcionarios || [];
  const totalCount = funcionariosData?.totalCount || 0;
  const totalPages = funcionariosData?.totalPages || 0;

  console.log('✅ FuncionariosTab - Dados carregados:', {
    planoId: plano.id,
    totalCount,
    funcionarios: funcionarios.length,
    stats,
    statusFilter
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const resetPagination = () => {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  const handleAtivarFuncionario = async (funcionarioId: string) => {
    // Esta funcionalidade será implementada no DataTable
  };

  const handleRemoverFuncionario = async (funcionarioId: string) => {
    // Esta funcionalidade será implementada no DataTable
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Ativos</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.ativos || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-muted-foreground">Pendentes</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pendentes || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold">
              {stats?.total || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Custo por Funcionário</span>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.custoPorFuncionario || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles e Tabela */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários do Plano ({totalCount})
            </CardTitle>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Funcionário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Busca e Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar funcionário por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <FuncionariosPlanoDataTable
            data={funcionarios}
            isLoading={isLoading}
            totalCount={totalCount}
            currentPage={pagination.pageIndex}
            pageSize={pagination.pageSize}
            onPageChange={(page) => setPagination({ ...pagination, pageIndex: page })}
            onAtivarFuncionario={handleAtivarFuncionario}
            onRemoverFuncionario={handleRemoverFuncionario}
            isUpdating={false}
            tipoSeguro={plano.tipo_seguro === 'saude' ? 'saude' : 'vida'}
          />
        </CardContent>
      </Card>

      {/* Modal para Adicionar Funcionário */}
      <AdicionarFuncionarioModal
        cnpjId={plano.cnpj_id}
        planoSeguradora={plano.seguradora}
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
        onFuncionarioAdded={resetPagination}
      />
    </div>
  );
};
