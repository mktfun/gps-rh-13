import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Download } from 'lucide-react';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';
import { useExportData, ExportField } from '@/hooks/useExportData';
import { ExportModal } from '@/components/ui/export-modal';
import { useToast } from '@/hooks/use-toast';
import { usePlanoFuncionariosExport } from '@/hooks/usePlanoFuncionariosExport';

interface PlanoFuncionariosTabProps {
  planoId: string;
}

export default function PlanoFuncionariosTab({ planoId }: PlanoFuncionariosTabProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const { toast } = useToast();

  const { data: planoDetalhes } = usePlanoDetalhes(planoId);
  const { fetchAllFuncionarios, isLoading: isLoadingExport } = usePlanoFuncionariosExport();
  
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
    formatDate
  } = useExportData();
  
  const { data, isLoading } = usePlanoFuncionarios({
    planoId,
    tipoSeguro: planoDetalhes?.tipo_seguro || 'vida',
    statusFilter,
    search,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  const funcionarios = data?.funcionarios || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 0;

  const exportFields: ExportField[] = [
    { key: 'nome', label: 'Nome do Funcionário', selected: true },
    { key: 'cpf', label: 'CPF', selected: true, format: formatCPF },
    { key: 'cargo', label: 'Cargo', selected: true },
    { key: 'idade', label: 'Idade', selected: true },
    { key: 'salario', label: 'Salário', selected: true, format: formatCurrency },
    { key: 'valor_mensal_plano', label: 'Valor Mensal do Plano', selected: true, format: formatCurrency },
    { key: 'status', label: 'Status', selected: true },
    { key: 'data_contratacao', label: 'Data de Contratação', selected: true, format: formatDate }
  ];

  const handleExportFuncionarios = async () => {
    try {
      toast({
        title: 'Carregando dados...',
        description: 'Buscando todos os funcionários filtrados para exportação.',
      });

      // Buscar TODOS os funcionários com os filtros aplicados
      const todosFuncionarios = await fetchAllFuncionarios({
        planoId,
        tipoSeguro: planoDetalhes?.tipo_seguro || 'vida',
        statusFilter: statusFilter !== 'todos' ? statusFilter : undefined,
        search: search || undefined
      });

      if (!todosFuncionarios || todosFuncionarios.length === 0) {
        toast({
          title: 'Nenhum dado para exportar',
          description: 'Não há funcionários para exportar com os filtros aplicados.',
          variant: 'destructive'
        });
        return;
      }

      // Adicionar o valor mensal do plano
      const dataParaExportar = todosFuncionarios.map(func => ({
        ...func,
        valor_mensal_plano: planoDetalhes?.valor_mensal || 0
      }));

      let nomeArquivo = `funcionarios_plano_${planoDetalhes?.seguradora || 'seguro'}`;
      if (statusFilter !== 'todos') nomeArquivo += `_${statusFilter}`;
      if (search) nomeArquivo += '_filtrado';
      nomeArquivo = nomeArquivo.replace(/\s+/g, '_').toLowerCase();

      console.log('📊 Exportando', dataParaExportar.length, 'funcionários');

      openExportPreview(dataParaExportar, exportFields, nomeArquivo);
    } catch (error) {
      console.error('Erro ao buscar dados para exportação:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Ocorreu um erro ao buscar os dados para exportação.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Funcionários Vinculados ao Plano</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {totalCount} funcionário(s) vinculado(s) a este plano
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportFuncionarios}
              disabled={isLoading || isLoadingExport || totalCount === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isLoadingExport ? 'Carregando...' : 'Exportar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativo">Ativos</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
                <SelectItem value="inativo">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          {planoDetalhes && (
            <FuncionariosPlanoDataTable
              funcionarios={funcionarios}
              isLoading={isLoading}
              totalCount={totalCount}
              totalPages={totalPages}
              pagination={pagination}
              setPagination={setPagination}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              plano={{
                id: planoId,
                tipoSeguro: planoDetalhes.tipo_seguro || 'vida',
                seguradora: planoDetalhes.seguradora,
                valor_mensal: planoDetalhes.valor_mensal,
                cnpj_id: planoDetalhes.cnpj_id,
              }}
            />
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
        dataCount={funcionarios?.length || 0}
      />
    </div>
  );
}