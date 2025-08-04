
import React, { useState } from 'react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { Calendar, TrendingUp, TrendingDown, Users, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRelatorioMovimentacao, RelatorioMovimentacaoItem } from '@/hooks/useRelatorioMovimentacao';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { ExportModal } from '@/components/ui/export-modal';

const RelatorioMovimentacaoPage = () => {
  // Estados dos filtros
  const [dataInicio, setDataInicio] = useState(() => 
    format(startOfMonth(subMonths(new Date(), 11)), 'yyyy-MM-dd')
  );
  const [dataFim, setDataFim] = useState(() => 
    format(endOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [filtrosAplicados, setFiltrosAplicados] = useState(false);

  // Hook do relatório
  const { data: dadosMovimentacao, isLoading, error, refetch } = useRelatorioMovimentacao(
    dataInicio,
    dataFim,
    filtrosAplicados
  );

  // Hook de exportação
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
    formatDate
  } = useExportData<RelatorioMovimentacaoItem>();

  // Aplicar filtros
  const handleAplicarFiltros = () => {
    if (new Date(dataFim) < new Date(dataInicio)) {
      alert('Data fim deve ser maior ou igual à data início');
      return;
    }
    setFiltrosAplicados(true);
    refetch();
  };

  // Calcular totais do período
  const totais = dadosMovimentacao.reduce(
    (acc, item) => ({
      inclusoes: acc.inclusoes + item.inclusoes,
      exclusoes: acc.exclusoes + item.exclusoes,
      saldo: acc.saldo + item.saldo
    }),
    { inclusoes: 0, exclusoes: 0, saldo: 0 }
  );

  // Configuração dos campos de exportação
  const exportFields: ExportField[] = [
    { key: 'mes', label: 'Mês', selected: true },
    { key: 'inclusoes', label: 'Inclusões', selected: true },
    { key: 'exclusoes', label: 'Exclusões', selected: true },
    { key: 'saldo', label: 'Saldo', selected: true }
  ];

  const handleExport = () => {
    const filename = `movimentacao_mensal_${dataInicio}_${dataFim}`;
    openExportPreview(dadosMovimentacao, exportFields, filename);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Relatório de Movimentação Mensal</h1>
          <p className="text-muted-foreground">
            Acompanhe as inclusões e exclusões de funcionários mês a mês
          </p>
        </div>
      </div>

      {/* Filtros de Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
          <CardDescription>
            Selecione o período para análise da movimentação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAplicarFiltros} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      {filtrosAplicados && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Inclusões</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totais.inclusoes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Exclusões</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {isLoading ? <Skeleton className="h-8 w-16" /> : totais.exclusoes}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totais.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {isLoading ? <Skeleton className="h-8 w-16" /> : totais.saldo > 0 ? `+${totais.saldo}` : totais.saldo}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ações</CardTitle>
              <Download className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleExport} 
                disabled={isLoading || dadosMovimentacao.length === 0}
                size="sm"
                className="w-full"
              >
                Exportar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabela Principal */}
      {filtrosAplicados && (
        <Card>
          <CardHeader>
            <CardTitle>Movimentação por Mês</CardTitle>
            <CardDescription>
              Detalhamento das inclusões e exclusões mês a mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-600">
                Erro ao carregar dados: {error.message}
              </div>
            ) : dadosMovimentacao.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado encontrado para o período selecionado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-center">Inclusões</TableHead>
                    <TableHead className="text-center">Exclusões</TableHead>
                    <TableHead className="text-center">Saldo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dadosMovimentacao.map((item) => (
                    <TableRow key={item.mes}>
                      <TableCell className="font-medium">
                        {new Date(item.mes + '-01').toLocaleDateString('pt-BR', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-green-700 bg-green-100">
                          +{item.inclusoes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-red-700 bg-red-100">
                          -{item.exclusoes}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={item.saldo >= 0 ? "default" : "destructive"}
                          className={item.saldo >= 0 ? "bg-green-600" : ""}
                        >
                          {item.saldo > 0 ? `+${item.saldo}` : item.saldo}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Exportação */}
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
        dataCount={dadosMovimentacao.length}
      />
    </div>
  );
};

export default RelatorioMovimentacaoPage;
