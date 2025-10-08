import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';

interface PlanoFuncionariosTabProps {
  planoId: string;
}

export default function PlanoFuncionariosTab({ planoId }: PlanoFuncionariosTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data: planoDetalhes } = usePlanoDetalhes(planoId);
  
  const { data, isLoading } = usePlanoFuncionarios({
    planoId,
    tipoSeguro: planoDetalhes?.tipo_seguro || 'vida',
    statusFilter,
    search,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  const funcionarios = data?.funcionarios || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funcionários Vinculados ao Plano</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalCount} funcionário(s) vinculado(s) a este plano
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {planoDetalhes && (
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
                id: planoId,
                tipoSeguro: planoDetalhes.tipo_seguro || 'vida',
                seguradora: planoDetalhes.seguradora,
                valor_mensal: planoDetalhes.valor_mensal,
                cnpj_id: planoDetalhes.cnpj_id,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}