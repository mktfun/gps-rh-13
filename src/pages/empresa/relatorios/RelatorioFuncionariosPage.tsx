
import React, { useState } from 'react';
import { Download, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExportModal } from '@/components/ui/export-modal';
import { TableLoadingState } from '@/components/ui/loading-state';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { useRelatorioFuncionariosEmpresa } from '@/hooks/useRelatorioFuncionariosEmpresa';
import { useCnpjs } from '@/hooks/useCnpjs';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { useExportData } from '@/hooks/useExportData';

const RelatorioFuncionariosPage = () => {
  const [selectedCnpjId, setSelectedCnpjId] = useState<string>('all');
  
  const { data: empresaId } = useEmpresaId();
  const { cnpjs, isLoading: loadingCnpjs } = useCnpjs({ 
    empresaId: empresaId || '',
    page: 1,
    pageSize: 100
  });
  const { data: funcionarios, isLoading: loadingFuncionarios } = useRelatorioFuncionariosEmpresa({
    cnpjId: selectedCnpjId === 'all' ? undefined : selectedCnpjId
  });

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
    formatCPF,
    formatDate
  } = useExportData();

  const handleExport = () => {
    const exportFields = [
      { key: 'nome', label: 'Nome', selected: true },
      { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
      { key: 'cargo', label: 'Cargo', selected: true },
      { key: 'salario', label: 'Salário', selected: true, format: formatCurrency },
      { key: 'status', label: 'Status', selected: true },
      { key: 'cnpj_razao_social', label: 'CNPJ/Razão Social', selected: true },
      { key: 'data_contratacao', label: 'Data Contratação', selected: true, format: formatDate },
    ];

    openExportPreview(funcionarios || [], exportFields, 'relatorio_funcionarios_empresa');
  };

  const breadcrumbItems = [
    { label: 'Empresa', href: '/empresa' },
    { label: 'Relatórios' },
    { label: 'Funcionários' }
  ];

  if (loadingCnpjs || loadingFuncionarios || !empresaId) {
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
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Funcionários</h1>
          <p className="text-muted-foreground">
            Visualize e exporte dados dos funcionários da empresa
          </p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Selecione um CNPJ específico ou visualize todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <Select value={selectedCnpjId} onValueChange={setSelectedCnpjId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar CNPJ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os CNPJs</SelectItem>
                {cnpjs?.map((cnpj) => (
                  <SelectItem key={cnpj.id} value={cnpj.id}>
                    {cnpj.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionarios?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNPJs Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(funcionarios?.map(f => f.cnpj_razao_social)).size || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funcionarios?.filter(f => f.status === 'ativo').length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funcionarios?.filter(f => f.status === 'pendente').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionários</CardTitle>
          <CardDescription>
            Lista completa de funcionários {selectedCnpjId === 'all' ? 'de todos os CNPJs' : 'do CNPJ selecionado'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Salário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Data Contratação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funcionarios?.map((funcionario) => (
                <TableRow key={funcionario.funcionario_id}>
                  <TableCell className="font-medium">{funcionario.nome}</TableCell>
                  <TableCell>{formatCPF(funcionario.cpf)}</TableCell>
                  <TableCell>{funcionario.cargo}</TableCell>
                  <TableCell>{formatCurrency(funcionario.salario)}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs ${
                      funcionario.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      funcionario.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {funcionario.status}
                    </span>
                  </TableCell>
                  <TableCell>{funcionario.cnpj_razao_social}</TableCell>
                  <TableCell>{formatDate(funcionario.data_contratacao)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

export default RelatorioFuncionariosPage;
