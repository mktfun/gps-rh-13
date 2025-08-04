
import React, { useState } from 'react';
import { Download, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { TableLoadingState } from '@/components/ui/loading-state';
import { ExportModal } from '@/components/ui/export-modal';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useRelatorioFuncionariosEmpresaPaginado } from '@/hooks/useRelatorioFuncionariosEmpresaPaginado';
import { useExportData } from '@/hooks/useExportData';
import { createFuncionariosEmpresaRelatorioTableColumns } from '@/components/empresa/funcionariosEmpresaRelatorioTableColumns';
import type { PaginationState } from '@tanstack/react-table';

const RelatorioFuncionariosEmpresaPage = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: result, isLoading } = useRelatorioFuncionariosEmpresaPaginado({
    pageSize: pagination.pageSize,
    pageIndex: pagination.pageIndex,
  });

  const funcionarios = result?.data || [];
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

  const columns = createFuncionariosEmpresaRelatorioTableColumns();

  const handleExport = () => {
    const exportFields = [
      { key: 'nome', label: 'Nome', selected: true },
      { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
      { key: 'cargo', label: 'Cargo', selected: true },
      { key: 'salario', label: 'Salário', selected: true, format: formatCurrency },
      { key: 'status', label: 'Status', selected: true },
      { key: 'cnpj_razao_social', label: 'CNPJ', selected: true },
      { key: 'data_contratacao', label: 'Data Contratação', selected: true },
    ];

    openExportPreview(funcionarios || [], exportFields, 'relatorio_funcionarios_empresa');
  };

  const breadcrumbItems = [
    { label: 'Empresa', href: '/empresa' },
    { label: 'Relatórios' },
    { label: 'Funcionários' }
  ];

  // Calcular métricas
  const funcionariosAtivos = funcionarios?.filter(item => item.status === 'ativo').length || 0;
  const funcionariosPendentes = funcionarios?.filter(item => item.status === 'pendente').length || 0;
  const salarioMedio = funcionarios?.length > 0 
    ? funcionarios.reduce((sum, item) => sum + item.salario, 0) / funcionarios.length 
    : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <TableLoadingState rows={10} columns={6} showHeader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Funcionários</h1>
          <p className="text-muted-foreground">
            Visão completa dos funcionários da empresa
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Resumo de Funcionários */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionariosAtivos}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionariosPendentes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Médio</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(salarioMedio)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Funcionários com Paginação */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionários</CardTitle>
          <CardDescription>
            Lista completa dos funcionários da empresa ({totalCount} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={funcionarios}
            isLoading={isLoading}
            totalCount={totalCount}
            totalPages={totalPages}
            pagination={pagination}
            setPagination={setPagination}
            emptyStateTitle="Nenhum funcionário encontrado"
            emptyStateDescription="Não há funcionários cadastrados para esta empresa."
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
        dataCount={funcionarios?.length || 0}
      />
    </div>
  );
};

export default RelatorioFuncionariosEmpresaPage;
