import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Building2, Users, FileText, DollarSign } from 'lucide-react';
import { useRelatorioFinanceiroCorretora } from '@/hooks/useRelatorioFinanceiroCorretora';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { ExportModal } from '@/components/ui/export-modal';
import { TableLoadingState } from '@/components/ui/loading-state';
import { useToast } from '@/hooks/use-toast';
import { FixFinancialReportFunction } from '@/components/debug/FixFinancialReportFunction';

const RelatorioFinanceiroPage = () => {
  const { data: relatorioData, isLoading, error } = useRelatorioFinanceiroCorretora();
  const { toast } = useToast();
  
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
    formatCurrency
  } = useExportData();

  // Calculando totais gerais
  const totais = React.useMemo(() => {
    if (!relatorioData) return { cnpjs: 0, funcionarios: 0, custo: 0 };
    
    return relatorioData.reduce((acc, item) => ({
      cnpjs: acc.cnpjs + item.total_cnpjs_ativos,
      funcionarios: acc.funcionarios + item.total_funcionarios_segurados,
      custo: acc.custo + Number(item.custo_total_mensal)
    }), { cnpjs: 0, funcionarios: 0, custo: 0 });
  }, [relatorioData]);

  const handleExport = () => {
    if (!relatorioData?.length) {
      toast({
        title: 'Erro na exportação',
        description: 'Não há dados para exportar.',
        variant: 'destructive',
      });
      return;
    }

    const exportFields: ExportField[] = [
      { key: 'empresa_nome', label: 'Empresa', selected: true },
      { key: 'total_cnpjs_ativos', label: 'CNPJs Ativos', selected: true },
      { key: 'total_funcionarios_segurados', label: 'Funcionários Segurados', selected: true },
      { 
        key: 'custo_total_mensal', 
        label: 'Custo Mensal Total', 
        selected: true, 
        format: (value) => formatCurrency(Number(value))
      }
    ];

    openExportPreview(relatorioData, exportFields, 'relatorio_financeiro_empresas');
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p>Erro ao carregar o relatório financeiro.</p>
              <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Relatório Financeiro por Empresa</h1>
          <p className="text-muted-foreground">
            Análise financeira detalhada de todas as empresas clientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FixFinancialReportFunction />
          <Button
            onClick={handleExport}
            disabled={isLoading || !relatorioData?.length}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relatorioData?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Empresas com CNPJs ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CNPJs Ativos</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.cnpjs}</div>
            <p className="text-xs text-muted-foreground">
              Total de CNPJs ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários Segurados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totais.funcionarios}</div>
            <p className="text-xs text-muted-foreground">
              Total de funcionários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totais.custo)}</div>
            <p className="text-xs text-muted-foreground">
              Receita mensal total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Breakdown por Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableLoadingState rows={5} columns={4} />
          ) : !relatorioData?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma empresa com CNPJs ativos encontrada.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-center">CNPJs Ativos</TableHead>
                  <TableHead className="text-center">Funcionários Segurados</TableHead>
                  <TableHead className="text-right">Custo Mensal Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatorioData.map((item) => (
                  <TableRow key={item.empresa_id}>
                    <TableCell className="font-medium">
                      {item.empresa_nome}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.total_cnpjs_ativos}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.total_funcionarios_segurados}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(Number(item.custo_total_mensal))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
        dataCount={relatorioData?.length || 0}
      />
    </div>
  );
};

export default RelatorioFinanceiroPage;
