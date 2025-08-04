
import React from 'react';
import { Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExportModal } from '@/components/ui/export-modal';
import { TableLoadingState } from '@/components/ui/loading-state';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useRelatorioPendenciasEmpresa } from '@/hooks/useRelatorioPendenciasEmpresa';
import { useExportData } from '@/hooks/useExportData';

const RelatorioPendenciasEmpresaPage = () => {
  const { data: pendencias, isLoading } = useRelatorioPendenciasEmpresa();

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
    formatCPF,
    formatDate
  } = useExportData();

  const handleExport = () => {
    const exportFields = [
      { key: 'funcionario_nome', label: 'Funcionário', selected: true },
      { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
      { key: 'cargo', label: 'Cargo', selected: true },
      { key: 'status', label: 'Status', selected: true },
      { key: 'cnpj_razao_social', label: 'CNPJ/Razão Social', selected: true },
      { key: 'data_solicitacao', label: 'Data Solicitação', selected: true, format: formatDate },
      { key: 'motivo', label: 'Motivo', selected: true },
    ];

    openExportPreview(pendencias || [], exportFields, 'relatorio_pendencias_empresa');
  };

  const breadcrumbItems = [
    { label: 'Empresa', href: '/empresa' },
    { label: 'Relatórios' },
    { label: 'Pendências' }
  ];

  // Calcular estatísticas das pendências
  const totalPendencias = pendencias?.length || 0;
  const pendentesInclusao = pendencias?.filter(p => p.status === 'pendente').length || 0;
  const solicitacoesExclusao = pendencias?.filter(p => p.status === 'exclusao_solicitada').length || 0;
  const funcionariosInativos = pendencias?.filter(p => p.status === 'inativo').length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'exclusao_solicitada':
        return 'bg-red-100 text-red-800';
      case 'inativo':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <TableLoadingState rows={10} columns={7} showHeader />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumbs items={breadcrumbItems} />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Pendências</h1>
          <p className="text-muted-foreground">
            Funcionários que requerem atenção do RH
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Estatísticas das Pendências */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pendências</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendencias}</div>
            <p className="text-xs text-muted-foreground">
              Itens requerendo ação
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inclusões Pendentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendentesInclusao}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando processamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exclusões Solicitadas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{solicitacoesExclusao}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando confirmação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Inativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionariosInativos}</div>
            <p className="text-xs text-muted-foreground">
              Verificação necessária
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Pendências */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pendências</CardTitle>
          <CardDescription>
            Todos os funcionários que necessitam de ação do departamento de RH
          </CardDescription>
        </CardHeader>
        <CardContent>
          {totalPendencias === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-green-700 mb-2">
                🎉 Nenhuma pendência encontrada!
              </h3>
              <p className="text-muted-foreground">
                Todos os funcionários estão com status regular.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendencias?.map((pendencia, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{pendencia.funcionario_nome}</TableCell>
                    <TableCell>{formatCPF(pendencia.cpf)}</TableCell>
                    <TableCell>{pendencia.cargo}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(pendencia.status)}>
                        {pendencia.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{pendencia.cnpj_razao_social}</TableCell>
                    <TableCell>{formatDate(pendencia.data_solicitacao)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {pendencia.motivo}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
        dataCount={pendencias?.length || 0}
      />
    </div>
  );
};

export default RelatorioPendenciasEmpresaPage;
