
import React, { useState } from 'react';
import { Download, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { TableLoadingState } from '@/components/ui/loading-state';
import { ExportModal } from '@/components/ui/export-modal';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useRelatorioCustosEmpresaPaginado } from '@/hooks/useRelatorioCustosEmpresaPaginado';
import { useExportData } from '@/hooks/useExportData';
import { createCustoEmpresaTableColumns } from '@/components/empresa/custoEmpresaTableColumns';
import type { PaginationState } from '@tanstack/react-table';

const RelatorioCustosEmpresaPage = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: result, isLoading } = useRelatorioCustosEmpresaPaginado({
    pageSize: pagination.pageSize,
    pageIndex: pagination.pageIndex,
  });

  const custos = result?.data || [];
  const totalCount = result?.totalCount || 0;
  const totalPages = result?.totalPages || 0;

  const {
    isExporting,
    isPreviewOpen,
    exportOptions,
    openExportPreview,
    executeExport,
    updateExportOptions,
    toggleField,
    selectAllFields,
    deselectAllFields,
    setIsPreviewOpen,
    formatCurrency,
    formatCPF
  } = useExportData();

  const columns = createCustoEmpresaTableColumns();

  const handleExport = () => {
    const exportFields = [
      { key: 'cnpj_razao_social', label: 'CNPJ/Razão Social', selected: true },
      { key: 'funcionario_nome', label: 'Funcionário', selected: true },
      { key: 'funcionario_cpf', label: 'CPF', selected: true, format: formatCPF },
      { key: 'valor_individual', label: 'Valor Individual', selected: true, format: formatCurrency },
      { key: 'status', label: 'Status', selected: true },
      { key: 'total_cnpj', label: 'Total CNPJ', selected: true, format: formatCurrency },
    ];

    openExportPreview(custos || [], exportFields, 'relatorio_custos_empresa');
  };

  const breadcrumbItems = [
    { label: 'Empresa', href: '/empresa' },
    { label: 'Relatórios' },
    { label: 'Custos Detalhado' }
  ];

  // Calcular métricas corrigidas usando os valores do plano
  const custosUnicos = custos?.reduce((acc, item) => {
    if (!acc[item.cnpj_razao_social]) {
      acc[item.cnpj_razao_social] = {
        razao_social: item.cnpj_razao_social,
        valor_plano: item.valor_individual, // Valor do plano (mesmo para todos do CNPJ)
        funcionarios: []
      };
    }
    acc[item.cnpj_razao_social].funcionarios.push(item);
    return acc;
  }, {} as Record<string, any>) || {};

  const totalGeral = Object.values(custosUnicos).reduce((sum: number, cnpj: any) => sum + (cnpj.valor_plano || 0), 0);
  const funcionariosAtivos = custos?.filter(item => item.status === 'ativo').length || 0;
  const cnpjsComPlano = Object.values(custosUnicos).filter((cnpj: any) => cnpj.valor_plano > 0).length;
  const mediaPorCnpj = cnpjsComPlano > 0 ? totalGeral / cnpjsComPlano : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <TableLoadingState rows={10} columns={5} showHeader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Custos Detalhado</h1>
          <p className="text-muted-foreground">
            Análise detalhada dos custos por funcionário e CNPJ
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo Financeiro Corrigido */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Total Mensal</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalGeral)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Soma dos valores dos planos ativos
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Cobertos</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionariosAtivos}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Funcionários com plano ativo
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio por CNPJ</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mediaPorCnpj)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Valor médio por plano
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNPJs com Plano</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cnpjsComPlano}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Planos de seguro ativos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Custos com Paginação */}
      <Card>
        <CardHeader>
          <CardTitle>Custos Detalhados</CardTitle>
          <CardDescription>
            Breakdown completo dos custos por funcionário e CNPJ ({totalCount} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={custos}
            isLoading={isLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            pagination={pagination}
            setPagination={setPagination}
            emptyStateTitle="Nenhum custo encontrado"
            emptyStateDescription="Não há dados de custos disponíveis para esta empresa."
          />
        </CardContent>
      </Card>

      <ExportModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        exportOptions={exportOptions}
        onUpdateOptions={updateExportOptions}
        onToggleField={toggleField}
        onSelectAll={selectAllFields}
        onDeselectAll={deselectAllFields}
        onExecuteExport={executeExport}
        isExporting={isExporting}
        dataCount={custos?.length || 0}
      />
    </div>
  );
};

export default RelatorioCustosEmpresaPage;
