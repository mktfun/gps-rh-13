
import React, { useState } from 'react';
import { FileText, Filter, Download, Building, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExportModal } from '@/components/ui/export-modal';
import { useRelatorioGeralFuncionarios } from '@/hooks/useRelatorioGeralFuncionarios';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useExportData, ExportField } from '@/hooks/useExportData';

const statusOptions = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'desativado', label: 'Desativado' },
  { value: 'exclusao_solicitada', label: 'Exclusão Solicitada' },
  { value: 'pendente_exclusao', label: 'Pendente Exclusão' },
  { value: 'arquivado', label: 'Arquivado' },
];

const RelatorioFuncionariosPage = () => {
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [filtersApplied, setFiltersApplied] = useState(false);

  // Buscar empresas para o select
  const { empresas, isLoading: isLoadingEmpresas } = useEmpresas({ pageSize: 1000 });

  // Buscar dados do relatório
  const { 
    data: funcionarios = [], 
    isLoading: isLoadingFuncionarios,
    refetch 
  } = useRelatorioGeralFuncionarios({
    empresaId: selectedEmpresaId || undefined,
    status: selectedStatus || undefined,
    enabled: filtersApplied
  });

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
    formatCPF,
    formatCNPJ,
    formatDate
  } = useExportData();

  // Campos de exportação
  const exportFields: ExportField[] = [
    { key: 'funcionario_nome', label: 'Nome do Funcionário', selected: true },
    { key: 'funcionario_cpf', label: 'CPF', selected: true, format: formatCPF },
    { key: 'funcionario_cargo', label: 'Cargo', selected: true },
    { key: 'funcionario_salario', label: 'Salário', selected: true, format: formatCurrency },
    { key: 'funcionario_status', label: 'Status', selected: true },
    { key: 'funcionario_data_contratacao', label: 'Data de Contratação', selected: true, format: formatDate },
    { key: 'empresa_nome', label: 'Empresa', selected: true },
    { key: 'cnpj_razao_social', label: 'CNPJ (Filial)', selected: true },
    { key: 'cnpj_numero', label: 'Número do CNPJ', selected: true, format: formatCNPJ },
  ];

  const handleApplyFilters = () => {
    setFiltersApplied(true);
    refetch();
  };

  const handleClearFilters = () => {
    setSelectedEmpresaId('');
    setSelectedStatus('');
    setFiltersApplied(false);
  };

  const handleExportReport = () => {
    if (funcionarios.length === 0) {
      return;
    }

    openExportPreview(
      funcionarios,
      exportFields,
      'relatorio_funcionarios_filtrado'
    );
  };

  const getFilterSummary = () => {
    const filters = [];
    if (selectedEmpresaId) {
      const empresa = empresas.find(e => e.id === selectedEmpresaId);
      filters.push(`Empresa: ${empresa?.nome || 'Selecionada'}`);
    }
    if (selectedStatus) {
      const status = statusOptions.find(s => s.value === selectedStatus);
      filters.push(`Status: ${status?.label || selectedStatus}`);
    }
    return filters;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Relatório Geral de Funcionários</h1>
          <p className="text-muted-foreground">
            Visualize e exporte dados de funcionários com filtros personalizados
          </p>
        </div>
      </div>

      {/* Área de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros do Relatório
          </CardTitle>
          <CardDescription>
            Configure os filtros para personalizar o relatório de funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Empresa */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Empresa</label>
              <Select value={selectedEmpresaId} onValueChange={setSelectedEmpresaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas.map((empresa) => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button 
              onClick={handleApplyFilters}
              disabled={isLoadingEmpresas || isLoadingFuncionarios}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Aplicar Filtros
            </Button>
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              disabled={!selectedEmpresaId && !selectedStatus}
            >
              Limpar Filtros
            </Button>
          </div>

          {/* Resumo dos Filtros Aplicados */}
          {filtersApplied && getFilterSummary().length > 0 && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Filtros aplicados:</p>
              <div className="flex flex-wrap gap-2">
                {getFilterSummary().map((filter, index) => (
                  <Badge key={index} variant="secondary">
                    {filter}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Área de Resultados */}
      {filtersApplied && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resultados do Relatório
              </div>
              <Badge variant="outline" className="text-lg px-3 py-1">
                {funcionarios.length} funcionário{funcionarios.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
            <CardDescription>
              {funcionarios.length > 0 
                ? 'Dados prontos para exportação'
                : 'Nenhum funcionário encontrado com os filtros aplicados'
              }
            </CardDescription>
          </CardHeader>

          {funcionarios.length > 0 && (
            <>
              <CardContent>
                <Separator className="mb-6" />
                
                {/* Botão de Exportação */}
                <div className="flex justify-center">
                  <Button
                    size="lg"
                    onClick={handleExportReport}
                    className="gap-2 px-8 py-3 text-lg"
                  >
                    <Download className="h-5 w-5" />
                    Exportar Relatório ({funcionarios.length} registros)
                  </Button>
                </div>
              </CardContent>
            </>
          )}

          {/* Loading State */}
          {isLoadingFuncionarios && (
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Carregando dados...</p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Estado Inicial */}
      {!filtersApplied && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Configure os filtros acima</h3>
              <p className="text-muted-foreground mb-4">
                Selecione os filtros desejados e clique em "Aplicar Filtros" para gerar o relatório
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
        dataCount={funcionarios.length}
      />
    </div>
  );
};

export default RelatorioFuncionariosPage;
