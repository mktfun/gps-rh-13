
import React from 'react';
import { MoreHorizontal, Edit, Trash2, Building2, Download } from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { ExportModal } from '@/components/ui/export-modal';
import { useExportData } from '@/hooks/useExportData';
import { Database } from '@/integrations/supabase/types';

type Cnpj = Database['public']['Tables']['cnpjs']['Row'];

interface CnpjsTableProps {
  cnpjs: Cnpj[];
  isLoading: boolean;
  totalCount: number;
  totalPages: number;
  pagination: {
    pageIndex: number;
    pageSize: number;
  };
  setPagination: (pagination: { pageIndex: number; pageSize: number }) => void;
  onEdit: (cnpj: Cnpj) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
}

const CnpjsTable: React.FC<CnpjsTableProps> = ({
  cnpjs,
  isLoading,
  totalCount,
  totalPages,
  pagination,
  setPagination,
  onEdit,
  onDelete,
  onAdd,
}) => {
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
    formatDateTime
  } = useExportData<Cnpj>();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'default';
      case 'configuracao':
        return 'secondary';
      case 'inativo':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'configuracao':
        return 'Em Configuração';
      case 'inativo':
        return 'Inativo';
      default:
        return status;
    }
  };

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  };

  const handleExport = () => {
    const exportFields = [
      { key: 'cnpj', label: 'CNPJ', selected: true },
      { key: 'razao_social', label: 'Razão Social', selected: true },
      { 
        key: 'status', 
        label: 'Status', 
        selected: true,
        format: (value: string) => getStatusLabel(value)
      },
      { 
        key: 'created_at', 
        label: 'Data de Cadastro', 
        selected: true,
        format: formatDateTime
      },
      { 
        key: 'updated_at', 
        label: 'Última Atualização', 
        selected: true,
        format: formatDateTime
      }
    ];

    openExportPreview(cnpjs, exportFields, 'cnpjs');
  };

  const columns: ColumnDef<Cnpj>[] = [
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {formatCNPJ(row.getValue('cnpj'))}
        </div>
      ),
    },
    {
      accessorKey: 'razao_social',
      header: 'Razão Social',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.getValue('razao_social')}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={getStatusColor(row.getValue('status'))}>
          {getStatusLabel(row.getValue('status'))}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Ações',
      cell: ({ row }) => {
        const cnpj = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit(cnpj)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(cnpj.id)}
                className="cursor-pointer text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  if (cnpjs.length === 0 && !isLoading) {
    return (
      <div className="rounded-md border border-dashed border-gray-200">
        <EmptyState
          icon={Building2}
          title="Nenhum CNPJ cadastrado"
          description="Adicione o primeiro CNPJ desta empresa para começar a gerenciar filiais e configurar os planos de seguro."
          action={onAdd ? {
            label: "Adicionar Primeiro CNPJ",
            onClick: onAdd
          } : undefined}
          className="py-12"
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header com botão de exportação */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
            disabled={cnpjs.length === 0}
          >
            <Download className="h-4 w-4" />
            Exportar Dados
          </Button>
        </div>

        {/* DataTable com paginação */}
        <DataTable
          columns={columns}
          data={cnpjs}
          isLoading={isLoading}
          totalCount={totalCount}
          totalPages={totalPages}
          pagination={pagination}
          setPagination={setPagination}
          emptyStateTitle="Nenhum CNPJ encontrado"
          emptyStateDescription="Não há CNPJs cadastrados para esta empresa."
        />
      </div>

      {/* Modal de exportação */}
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
        dataCount={cnpjs.length}
      />
    </>
  );
};

export default CnpjsTable;
