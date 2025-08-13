import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/ui/data-table';
import { TableLoadingState } from '@/components/ui/loading-state';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { DateRangePicker } from '@/components/relatorios/DateRangePicker';
import { CostsKPICards } from '@/components/relatorios/CostsKPICards';
import { CostsEvolutionChart } from '@/components/relatorios/CostsEvolutionChart';
import { CostsDistributionChart } from '@/components/relatorios/CostsDistributionChart';
import { createCostsDetailedTableColumns } from '@/components/relatorios/costsDetailedTableColumns';
import { useCostsReport } from '@/hooks/useCostsReport';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

const RelatorioCustosDetalhadoPage = () => {
  // Últimos 6 meses como padrão para melhor visualização histórica
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(subMonths(new Date(), 5)),
    to: endOfMonth(new Date())
  });

  const { data: reportData, isLoading } = useCostsReport({
    startDate: dateRange?.from,
    endDate: dateRange?.to
  });

  const columns = createCostsDetailedTableColumns();

  const handleExport = () => {
    // Implementar exportação futuramente
    console.log('Exportar relatório', reportData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <TableLoadingState rows={10} columns={6} showHeader />
      </div>
    );
  }

  // Garantir valores padrão para evitar erros de undefined
  const kpis = {
    custo_total_periodo: reportData?.kpis?.custo_total_periodo || 0,
    custo_medio_funcionario: reportData?.kpis?.custo_medio_funcionario || 0,
    variacao_percentual: reportData?.kpis?.variacao_percentual || 0,
    total_funcionarios_ativos: reportData?.kpis?.total_funcionarios_ativos || 0
  };

  const evolucaoTemporal = reportData?.evolucao_temporal || [];
  const distribuicaoCNPJs = reportData?.distribuicao_cnpjs || [];
  const tabelaDetalhada = reportData?.tabela_detalhada || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Custos Detalhado</h1>
          <p className="text-muted-foreground">
            Análise completa dos custos com planos de seguro por período
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

      {/* Debug Information */}
      <CostsReportDebug
        data={{
          reportData,
          kpis,
          evolucaoTemporal_length: evolucaoTemporal?.length,
          distribuicaoCNPJs_length: distribuicaoCNPJs?.length,
          tabelaDetalhada_length: tabelaDetalhada?.length,
          dateRange,
          sample_tabela: tabelaDetalhada?.slice(0, 2)
        }}
        title="Detailed Costs Report Debug"
      />

      {/* KPIs */}
      <CostsKPICards
        custoTotalPeriodo={kpis.custo_total_periodo}
        custoMedioFuncionario={kpis.custo_medio_funcionario}
        variacaoPercentual={kpis.variacao_percentual}
        totalFuncionariosAtivos={kpis.total_funcionarios_ativos}
      />

      {/* Gráficos */}
      <div className="grid gap-6 md:grid-cols-2">
        <CostsEvolutionChart data={evolucaoTemporal} />
        <CostsDistributionChart data={distribuicaoCNPJs} />
      </div>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por CNPJ</CardTitle>
          <CardDescription>
            Breakdown completo dos custos por plano e funcionários ({tabelaDetalhada.length} registros)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tabelaDetalhada}
            isLoading={isLoading}
            emptyStateTitle="Nenhum plano encontrado"
            emptyStateDescription="Não há planos ativos no período selecionado."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioCustosDetalhadoPage;
