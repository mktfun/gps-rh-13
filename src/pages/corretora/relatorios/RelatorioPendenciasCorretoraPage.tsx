import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/relatorios/DateRangePicker';
import { DataTable } from '@/components/ui/data-table';
import { PendenciasKPICards } from '@/components/relatorios/PendenciasKPICards';
import PendenciasByTypeChart from '@/components/relatorios/PendenciasByTypeChart';
import PendenciasTimelineChart from '@/components/relatorios/PendenciasTimelineChart';
import PendenciasByCNPJChart from '@/components/relatorios/PendenciasByCNPJChart';
import { createPendenciasTableColumns } from '@/components/relatorios/pendenciasDetailedTableColumns';
import { usePendenciasReport } from '@/hooks/usePendenciasReport';
import { useAllCnpjs } from '@/hooks/useAllCnpjs';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { Download, Search, Filter, PieChart, BarChart3, Building, Table } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import { useLocation } from 'react-router-dom';
import type { DateRange } from 'react-day-picker';
import { CorrigirPendenciasButton } from '@/components/debug/CorrigirPendenciasButton';
import { SincronizarPendenciasButton } from '@/components/debug/SincronizarPendenciasButton';
import { PendencyVisibilityDebug } from '@/components/debug/PendencyVisibilityDebug';

const RelatorioPendenciasCorretoraPage = () => {
  const location = useLocation();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [tipoFilter, setTipoFilter] = useState<string>('todas');
  const [cnpjFilter, setCnpjFilter] = useState<string>('todas');
  const [searchValue, setSearchValue] = useState<string>('');

  const { cnpjs } = useAllCnpjs();

  // ✅ NOVO: Aplicar filtro de empresa ao navegar da lista de empresas
  useEffect(() => {
    const state = location.state as { empresaId?: string; empresaNome?: string } | null;
    if (state?.empresaId) {
      console.log('🔗 Aplicando filtro pré-selecionado para empresa:', state.empresaNome);
      
      // Encontrar o CNPJ da empresa selecionada
      const cnpjDaEmpresa = cnpjs?.find(cnpj => 
        cnpj.empresa_id === state.empresaId
      );
      
      if (cnpjDaEmpresa) {
        setCnpjFilter(cnpjDaEmpresa.id);
        console.log('✅ Filtro aplicado para CNPJ:', cnpjDaEmpresa.razao_social);
      }
    }
  }, [location.state, cnpjs]);

  const { data: reportData, isLoading } = usePendenciasReport(
    dateRange.from,
    dateRange.to,
    statusFilter,
    tipoFilter,
    cnpjFilter
  );

  const {
    openExportPreview,
    formatCurrency,
    formatCPF,
    formatDate,
    formatDateTime
  } = useExportData();

  const columns = createPendenciasTableColumns();

  // Filtrar dados da tabela por busca
  const filteredTableData = reportData?.tabela_detalhada?.filter(item => {
    if (!searchValue) return true;
    const searchLower = searchValue.toLowerCase();
    return (
      item.protocolo.toLowerCase().includes(searchLower) ||
      item.funcionario_nome.toLowerCase().includes(searchLower) ||
      item.descricao.toLowerCase().includes(searchLower) ||
      item.razao_social.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleExport = () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      console.log('Nenhum dado para exportar');
      return;
    }

    const exportFields: ExportField[] = [
      { key: 'protocolo', label: 'Protocolo', selected: true },
      { key: 'tipo', label: 'Tipo', selected: true },
      { key: 'funcionario_nome', label: 'Nome do Funcionário', selected: true },
      { key: 'funcionario_cpf', label: 'CPF do Funcionário', selected: true, format: formatCPF },
      { key: 'razao_social', label: 'Razão Social', selected: true },
      { key: 'cnpj', label: 'CNPJ', selected: true },
      { key: 'descricao', label: 'Descrição', selected: true },
      { key: 'data_criacao', label: 'Data de Criação', selected: true, format: formatDate },
      { key: 'data_vencimento', label: 'Data de Vencimento', selected: true, format: formatDate },
      { key: 'status_prioridade', label: 'Prioridade', selected: true },
      { key: 'dias_em_aberto', label: 'Dias em Aberto', selected: true },
      { key: 'comentarios_count', label: 'Qtd. Comentários', selected: true }
    ];

    const filename = `relatorio-pendencias-${new Date().toISOString().split('T')[0]}`;
    
    openExportPreview(filteredTableData, exportFields, filename);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({
        from: range.from,
        to: range.to
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Pendências</h1>
          <p className="text-muted-foreground">
            Análise completa de pendências e solicitações em aberto
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CorrigirPendenciasButton />
          <SincronizarPendenciasButton />
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Exportar Excel
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
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="text-sm font-medium mb-2 block">Período</label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="critica">Críticas</SelectItem>
                  <SelectItem value="urgente">Urgentes</SelectItem>
                  <SelectItem value="normal">Normais</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="documentacao">Documentação</SelectItem>
                  <SelectItem value="ativacao">Ativação</SelectItem>
                  <SelectItem value="alteracao">Alteração</SelectItem>
                  <SelectItem value="cancelamento">Cancelamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">CNPJ</label>
              <Select value={cnpjFilter} onValueChange={setCnpjFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o CNPJ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas empresas</SelectItem>
                  {cnpjs?.map(cnpj => (
                    <SelectItem key={cnpj.id} value={cnpj.id}>
                      {cnpj.razao_social}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Protocolo, funcionário..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <PendenciasKPICards
        totalPendencias={reportData?.kpis.total_pendencias || 0}
        pendenciasCriticas={reportData?.kpis.pendencias_criticas || 0}
        pendenciasUrgentes={reportData?.kpis.pendencias_urgentes || 0}
        pendenciasNormais={reportData?.kpis.pendencias_normais || 0}
        isLoading={isLoading}
      />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Pendências por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendenciasByTypeChart dados={reportData?.pendencias_por_tipo || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Timeline de Vencimentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendenciasTimelineChart dados={reportData?.timeline_vencimentos || []} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Pendências por CNPJ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PendenciasByCNPJChart dados={reportData?.pendencias_por_cnpj || []} />
          </CardContent>
        </Card>
      </div>

      {/* Debug Component */}
      <PendencyVisibilityDebug />

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Table className="h-5 w-5" />
            Pendências Detalhadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredTableData}
            isLoading={isLoading}
            emptyStateTitle="Nenhuma pendência encontrada"
            emptyStateDescription="Tente ajustar os filtros para encontrar pendências."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioPendenciasCorretoraPage;
