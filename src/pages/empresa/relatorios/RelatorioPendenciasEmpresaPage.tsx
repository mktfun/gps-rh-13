
import React, { useState } from 'react';
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
import { Download, Search, Filter, PieChart, BarChart3, Building, Table } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const RelatorioPendenciasEmpresaPage = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [tipoFilter, setTipoFilter] = useState<string>('todas');
  const [cnpjFilter, setCnpjFilter] = useState<string>('todas');
  const [searchValue, setSearchValue] = useState<string>('');

  const { cnpjs } = useAllCnpjs();
  const { data: reportData, isLoading } = usePendenciasReport(
    dateRange.from,
    dateRange.to,
    statusFilter,
    tipoFilter,
    cnpjFilter
  );

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
    console.log('Exportar dados:', filteredTableData);
    // TODO: Implementar exportação Excel
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
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Excel
        </Button>
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

export default RelatorioPendenciasEmpresaPage;
