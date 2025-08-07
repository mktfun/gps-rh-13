
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { TableLoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, Filter } from 'lucide-react';
import { DateRangePicker } from '@/components/relatorios/DateRangePicker';
import { FuncionariosKPICards } from '@/components/relatorios/FuncionariosKPICards';
import { FuncionariosEvolutionChart } from '@/components/relatorios/FuncionariosEvolutionChart';
import { FuncionariosStatusChart } from '@/components/relatorios/FuncionariosStatusChart';
import { FuncionariosByCNPJChart } from '@/components/relatorios/FuncionariosByCNPJChart';
import { createFuncionariosDetailedTableColumns } from '@/components/relatorios/funcionariosDetailedTableColumns';
import { useFuncionariosReport } from '@/hooks/useFuncionariosReport';
import { useAllCnpjs } from '@/hooks/useAllCnpjs';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { ExportModal } from '@/components/ui/export-modal';

const RelatorioFuncionariosPage = () => {
  // Estados para filtros
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  });
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cnpjFilter, setCnpjFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Buscar dados
  const { data: reportData, isLoading } = useFuncionariosReport({
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    statusFilter: statusFilter || undefined,
    cnpjFilter: cnpjFilter || undefined,
    searchTerm: searchTerm || undefined
  });

  const { data: cnpjsList = [] } = useAllCnpjs();

  // Hook de exportação
  const {
    openExportPreview,
    isPreviewOpen,
    setIsPreviewOpen,
    exportOptions,
    updateExportOptions,
    toggleField,
    selectAllFields,
    deselectAllFields,
    executeExport,
    isExporting,
    formatCurrency,
    formatDate
  } = useExportData();

  const columns = createFuncionariosDetailedTableColumns();

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9,11)}`;
  };

  // Campos de exportação
  const exportFields: ExportField[] = [
    { key: 'nome_completo', label: 'Nome Completo', selected: true },
    { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
    { key: 'razao_social', label: 'Empresa', selected: true },
    { key: 'cnpj', label: 'CNPJ', selected: true },
    { key: 'status', label: 'Status', selected: true },
    { key: 'data_admissao', label: 'Data Admissão', selected: true, format: formatDate },
    { key: 'data_ativacao_seguro', label: 'Ativação Seguro', selected: true, format: formatDate },
    { key: 'valor_individual', label: 'Valor Individual', selected: true, format: formatCurrency },
    { key: 'total_dependentes', label: 'Total Dependentes', selected: true },
  ];

  const handleExport = () => {
    if (!reportData?.tabela_detalhada || reportData.tabela_detalhada.length === 0) {
      return;
    }

    openExportPreview(
      reportData.tabela_detalhada,
      exportFields,
      'relatorio_funcionarios_detalhado'
    );
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setCnpjFilter('');
    setSearchTerm('');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <TableLoadingState rows={10} columns={7} showHeader />
      </div>
    );
  }

  // Dados seguros com fallbacks
  const kpis = reportData?.kpis || {
    total_funcionarios: 0,
    funcionarios_ativos: 0,
    funcionarios_inativos: 0,
    taxa_cobertura: 0
  };

  const evolucaoTemporal = reportData?.evolucao_temporal || [];
  const distribuicaoStatus = reportData?.distribuicao_status || [];
  const funcionariosPorCNPJ = reportData?.funcionarios_por_cnpj || [];
  const tabelaDetalhada = reportData?.tabela_detalhada || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Funcionários</h1>
          <p className="text-muted-foreground">
            Análise completa da movimentação e status dos funcionários
          </p>
        </div>
        <div className="flex items-center gap-4">
          <DateRangePicker 
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="desativado">Desativado</SelectItem>
                <SelectItem value="exclusao_solicitada">Exclusão Solicitada</SelectItem>
                <SelectItem value="arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>

            {/* CNPJ Filter */}
            <Select value={cnpjFilter} onValueChange={setCnpjFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as empresas</SelectItem>
                {cnpjsList.map((cnpj) => (
                  <SelectItem key={cnpj.id} value={cnpj.id}>
                    {cnpj.razao_social}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Clear Filters */}
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              disabled={!statusFilter && !cnpjFilter && !searchTerm}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <FuncionariosKPICards
        totalFuncionarios={kpis.total_funcionarios}
        funcionariosAtivos={kpis.funcionarios_ativos}
        funcionariosInativos={kpis.funcionarios_inativos}
        taxaCobertura={kpis.taxa_cobertura}
      />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FuncionariosEvolutionChart data={evolucaoTemporal} />
        </div>
        <FuncionariosStatusChart data={distribuicaoStatus} />
      </div>

      <FuncionariosByCNPJChart data={funcionariosPorCNPJ} />

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionários Detalhados</CardTitle>
          <CardDescription>
            Lista completa dos funcionários com informações detalhadas ({tabelaDetalhada.length} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tabelaDetalhada}
            isLoading={isLoading}
            emptyStateTitle="Nenhum funcionário encontrado"
            emptyStateDescription="Não há funcionários que atendam aos filtros selecionados."
          />
        </CardContent>
      </Card>

      {/* Export Modal */}
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
        dataCount={tabelaDetalhada.length}
      />
    </div>
  );
};

export default RelatorioFuncionariosPage;
