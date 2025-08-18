import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { usePendenciasEmpresa } from '@/hooks/usePendenciasEmpresa';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { Download, Search, Filter, PieChart, BarChart3, Building, Table } from 'lucide-react';
import { addDays, subDays } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { InvestigarPendenciaEspecifica } from '@/components/debug/InvestigarPendenciaEspecifica';
import { RelatorioPendenciasDebug } from '@/components/debug/RelatorioPendenciasDebug';

const RelatorioPendenciasEmpresaPage = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [tipoFilter, setTipoFilter] = useState<string>('todas');
  const [searchValue, setSearchValue] = useState<string>('');

  // Use empresa hook but process data similar to corretora format
  const { data: pendenciasRaw = [], isLoading } = usePendenciasEmpresa();

  const {
    openExportPreview,
    formatCurrency,
    formatCPF,
    formatDate,
    formatDateTime
  } = useExportData();

  const columns = createPendenciasTableColumns();

  // Transform empresa data to match corretora format for consistency
  const reportData = React.useMemo(() => {
    if (!pendenciasRaw || pendenciasRaw.length === 0) {
      return {
        kpis: {
          total_pendencias: 0,
          pendencias_criticas: 0,
          pendencias_urgentes: 0,
          pendencias_normais: 0
        },
        tabela_detalhada: [],
        pendencias_por_tipo: [],
        timeline_vencimentos: [],
        pendencias_por_cnpj: []
      };
    }

    // Filter by date range
    const filteredByDate = pendenciasRaw.filter(p => {
      const dataVencimento = new Date(p.data_vencimento);
      return dataVencimento >= dateRange.from && dataVencimento <= dateRange.to;
    });

    // Filter by status and type
    const filteredData = filteredByDate.filter(p => {
      const matchStatus = statusFilter === 'todas' || 
        (statusFilter === 'critica' && (p.dias_em_aberto > 30)) ||
        (statusFilter === 'urgente' && (p.dias_em_aberto > 15 && p.dias_em_aberto <= 30)) ||
        (statusFilter === 'normal' && (p.dias_em_aberto <= 15));
      
      const matchTipo = tipoFilter === 'todas' || p.tipo === tipoFilter;
      
      return matchStatus && matchTipo;
    });

    // Calculate KPIs
    const total_pendencias = filteredData.length;
    const pendencias_criticas = filteredData.filter(p => p.dias_em_aberto > 30).length;
    const pendencias_urgentes = filteredData.filter(p => p.dias_em_aberto > 15 && p.dias_em_aberto <= 30).length;
    const pendencias_normais = filteredData.filter(p => p.dias_em_aberto <= 15).length;

    // Transform to match corretora table format
    const tabela_detalhada = filteredData.map(p => ({
      protocolo: p.protocolo,
      tipo: p.tipo,
      funcionario_nome: p.funcionario_nome,
      funcionario_cpf: p.funcionario_cpf,
      razao_social: p.razao_social,
      cnpj: p.cnpj,
      descricao: p.descricao || '',
      data_criacao: p.data_criacao,
      data_vencimento: p.data_vencimento,
      status_prioridade: p.dias_em_aberto > 30 ? 'critica' : p.dias_em_aberto > 15 ? 'urgente' : 'normal',
      dias_em_aberto: p.dias_em_aberto,
      comentarios_count: 0 // Default for empresa
    }));

    // Group by type
    const tiposCount = filteredData.reduce((acc, p) => {
      acc[p.tipo] = (acc[p.tipo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const pendencias_por_tipo = Object.entries(tiposCount).map(([tipo, quantidade]) => ({
      tipo,
      quantidade,
      percentual: Math.round((quantidade / total_pendencias) * 100) || 0
    }));

    // Group by timeline
    const timelineCount = filteredData.reduce((acc, p) => {
      const data = p.data_vencimento;
      if (!acc[data]) {
        acc[data] = { data_vencimento: data, quantidade: 0, criticas: 0, urgentes: 0 };
      }
      acc[data].quantidade++;
      if (p.dias_em_aberto > 30) acc[data].criticas++;
      else if (p.dias_em_aberto > 15) acc[data].urgentes++;
      return acc;
    }, {} as Record<string, any>);

    const timeline_vencimentos = Object.values(timelineCount);

    // Group by CNPJ (for empresa this might be just one CNPJ)
    const cnpjCount = filteredData.reduce((acc, p) => {
      const key = p.cnpj;
      if (!acc[key]) {
        acc[key] = {
          cnpj: p.cnpj,
          razao_social: p.razao_social,
          total_pendencias: 0,
          criticas: 0,
          urgentes: 0
        };
      }
      acc[key].total_pendencias++;
      if (p.dias_em_aberto > 30) acc[key].criticas++;
      else if (p.dias_em_aberto > 15) acc[key].urgentes++;
      return acc;
    }, {} as Record<string, any>);

    const pendencias_por_cnpj = Object.values(cnpjCount);

    return {
      kpis: {
        total_pendencias,
        pendencias_criticas,
        pendencias_urgentes,
        pendencias_normais
      },
      tabela_detalhada,
      pendencias_por_tipo,
      timeline_vencimentos,
      pendencias_por_cnpj
    };
  }, [pendenciasRaw, dateRange, statusFilter, tipoFilter]);

  // Filter table data by search
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

    const filename = `relatorio-pendencias-empresa-${new Date().toISOString().split('T')[0]}`;
    
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
            Acompanhe todas as pendências da sua empresa
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
