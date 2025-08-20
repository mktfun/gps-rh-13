import React from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { TableLoadingSkeleton } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/ErrorState';
import { Building2 } from 'lucide-react';

export interface Column {
  accessorKey: string;
  header: string;
  cell?: (props: { row: { getValue: (key: string) => any }; original?: any }) => React.ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable({ 
  columns, 
  data, 
  loading, 
  emptyMessage = "Nenhum dado disponível",
  className 
}: DataTableProps) {
  if (loading) {
    return <TableLoadingSkeleton />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <EmptyState 
          title="Nenhum dado encontrado"
          description={emptyMessage}
          icon={Building2}
        />
      </div>
    );
  }

  return (
    <div className={cn("bg-white rounded-lg shadow-sm border overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessorKey}
                  className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    column.className
                  )}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-gray-50 transition-colors"
              >
                {columns.map((column) => (
                  <td
                    key={column.accessorKey}
                    className={cn(
                      "px-6 py-4 whitespace-nowrap text-sm text-gray-900",
                      column.className
                    )}
                  >
                    {column.cell ? (
                      column.cell({ 
                        row: { 
                          getValue: (key: string) => row[key],
                          original: row 
                        } 
                      })
                    ) : (
                      row[column.accessorKey]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Hook para colunas padrão de custos por CNPJ
export function useCnpjTableColumns(): Column[] {
  return [
    {
      accessorKey: 'cnpj',
      header: 'CNPJ',
      cell: ({ row }) => (
        <div className="font-mono text-sm">
          {row.getValue('cnpj')}
        </div>
      ),
    },
    {
      accessorKey: 'razao_social',
      header: 'Razão Social',
      cell: ({ row }) => (
        <div className="max-w-xs">
          <div className="font-medium text-gray-900 truncate">
            {row.getValue('razao_social')}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'funcionarios_count',
      header: 'Funcionários',
      cell: ({ row }) => (
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {formatNumber(row.getValue('funcionarios_count'))}
          </span>
        </div>
      ),
      className: 'text-center',
    },
    {
      accessorKey: 'valor_mensal',
      header: 'Valor Mensal',
      cell: ({ row }) => (
        <div className="text-right font-semibold text-green-600">
          {formatCurrency(row.getValue('valor_mensal'))}
        </div>
      ),
      className: 'text-right',
    },
  ];
}

// Tabela específica para custos por CNPJ
export function CnpjCostTable({ data, loading }: { data: any[]; loading: boolean }) {
  const columns = useCnpjTableColumns();
  
  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage="Nenhum CNPJ cadastrado"
    />
  );
}
