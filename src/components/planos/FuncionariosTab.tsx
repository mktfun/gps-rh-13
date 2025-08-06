
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Search, DollarSign, AlertCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';
import { AdicionarFuncionarioModal } from '@/components/empresa/AdicionarFuncionarioModal';

interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
}

interface FuncionariosTabProps {
  plano: PlanoDetalhes;
}

export const FuncionariosTab: React.FC<FuncionariosTabProps> = ({ plano }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Buscar funcionários do plano
  const { data: funcionariosData, isLoading } = usePlanoFuncionarios({
    cnpjId: plano.cnpj_id,
    statusFilter: statusFilter === 'todos' ? undefined : statusFilter,
    search: search || undefined,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  // Buscar estatísticas
  const { data: stats } = usePlanoFuncionariosStats(plano.cnpj_id, plano.valor_mensal);

  const funcionarios = funcionariosData?.funcionarios || [];
  const totalCount = funcionariosData?.totalCount || 0;
  const totalPages = funcionariosData?.totalPages || 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const resetPagination = () => {
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
  };

  // Alertas baseados nos dados
  const hasAlerts = (stats?.pendentes || 0) > 0;

  return (
    <div className="space-y-6">
      
      {/* Alertas/Avisos */}
      {hasAlerts && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Atenção: Existem {stats?.pendentes} funcionário(s) pendente(s) de ativação
            </span>
          </div>
        </div>
      )}

      {/* Header da Seção */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">Funcionários do Plano</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie os funcionários vinculados ao plano {plano.seguradora}
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </div>

      {/* Estatísticas Resumidas - Mais Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Funcionários Ativos</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.ativos || 0}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-muted-foreground">Pendentes</span>
          </div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.pendentes || 0}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Total Geral</span>
          </div>
          <div className="text-2xl font-bold">
            {stats?.total || 0}
          </div>
        </div>
        
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Custo por Funcionário</span>
          </div>
          <div className="text-lg font-bold text-green-600">
            {formatCurrency(stats?.custoPorFuncionario || 0)}
          </div>
        </div>
      </div>

      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar funcionário por nome, CPF..."
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
            <SelectItem value="edicao_solicitada">Edição Solicitada</SelectItem>
            <SelectItem value="desativado">Desativados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Funcionários */}
      <div className="rounded-lg border">
        <FuncionariosPlanoDataTable
          funcionarios={funcionarios}
          isLoading={isLoading}
          totalCount={totalCount}
          totalPages={totalPages}
          pagination={pagination}
          setPagination={setPagination}
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          plano={{
            seguradora: plano.seguradora,
            valor_mensal: plano.valor_mensal,
            cnpj_id: plano.cnpj_id,
          }}
        />
      </div>

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
