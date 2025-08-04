import React, { useState } from 'react';
import { Shield, AlertCircle, Search, Users, TrendingUp, DollarSign } from 'lucide-react';
import { useEmpresaPlanosUnificados } from '@/hooks/useEmpresaPlanosUnificados';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { DataTable } from '@/components/ui/data-table';
import { createPlanosTableColumnsUnificadas } from '@/components/empresa/planosTableColumnsUnificadas';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

const EmpresaPlanosPage = () => {
  const { data: planos, isLoading, error } = useEmpresaPlanosUnificados();
  const [search, setSearch] = useState('');

  const columns = createPlanosTableColumnsUnificadas();

  // Filtrar planos baseado na busca
  const filteredPlanos = planos?.filter(plano =>
    plano.seguradora.toLowerCase().includes(search.toLowerCase()) ||
    plano.cnpj_razao_social.toLowerCase().includes(search.toLowerCase()) ||
    plano.cnpj_numero.includes(search)
  ) || [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Planos de Seguro</h1>
          <p className="text-muted-foreground">Visualize os detalhes dos seus planos de seguro de vida</p>
        </div>
        <DashboardLoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Planos de Seguro</h1>
          <p className="text-muted-foreground">Visualize os detalhes dos seus planos de seguro de vida</p>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-semibold text-foreground mb-2">Erro ao carregar os planos</p>
          <p className="text-sm text-muted-foreground">Tente recarregar a página ou entre em contato com o suporte</p>
        </div>
      </div>
    );
  }

  if (!planos || planos.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Planos de Seguro</h1>
          <p className="text-muted-foreground">Visualize os detalhes dos seus planos de seguro de vida</p>
        </div>
        
        <EmptyState
          icon={Shield}
          title="Nenhum Plano Encontrado"
          description="Nenhum plano de seguro configurado. Entre em contato com sua corretora para configurar um plano de seguro de vida para sua empresa."
          action={{
            label: 'Entrar em Contato',
            onClick: () => {
              console.log('Entrar em contato com corretora');
            }
          }}
        />
      </div>
    );
  }

  // Calcular totais usando os dados unificados corretos
  const totalCustoMensal = planos.reduce((sum, plano) => sum + plano.custo_mensal_real, 0);
  const totalFuncionariosAtivos = planos.reduce((sum, plano) => sum + plano.funcionarios_ativos, 0);
  const totalFuncionariosPendentes = planos.reduce((sum, plano) => sum + plano.funcionarios_pendentes, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Planos de Seguro</h1>
        <p className="text-muted-foreground">
          Visualize os detalhes dos seus planos de seguro de vida
        </p>
      </div>

      {/* Cards de Métricas - Design System */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(totalCustoMensal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os planos ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Cobertos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuncionariosAtivos}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários com cobertura ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFuncionariosPendentes}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando ativação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Planos Ativos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{planos.length}</div>
            <p className="text-xs text-muted-foreground">
              Seguros configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seus Planos de Seguro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de busca */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por seguradora ou CNPJ..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filteredPlanos.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {filteredPlanos.length} plano{filteredPlanos.length !== 1 ? 's' : ''} encontrado{filteredPlanos.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            {/* Tabela com Design System */}
            <DataTable
              columns={columns}
              data={filteredPlanos}
              emptyStateTitle="Nenhum plano encontrado"
              emptyStateDescription="Tente ajustar os filtros de busca ou entre em contato com sua corretora."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmpresaPlanosPage;
