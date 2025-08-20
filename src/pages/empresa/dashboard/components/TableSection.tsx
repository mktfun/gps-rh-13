import React, { useState } from 'react';
import { Building2, Search, SortAsc, SortDesc } from 'lucide-react';
import { CnpjCostTable } from '@/components/tables/DataTable';
import { DashboardMetrics, TableSectionProps } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TableSection({ data, loading }: TableSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'razao_social' | 'funcionarios_count' | 'valor_mensal'>('funcionarios_count');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtrar e ordenar dados
  const processedData = React.useMemo(() => {
    if (!data?.custosPorCnpj) return [];

    let filtered = data.custosPorCnpj;

    // Aplicar filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.razao_social.toLowerCase().includes(term) ||
        item.cnpj.includes(term)
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [data?.custosPorCnpj, searchTerm, sortField, sortDirection]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const totalFuncionarios = data?.custosPorCnpj?.reduce((sum, item) => sum + item.funcionarios_count, 0) || 0;
  const totalValor = data?.custosPorCnpj?.reduce((sum, item) => sum + item.valor_mensal, 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header da tabela */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Custos por CNPJ</h3>
          </div>
          
          {/* Estatísticas resumidas */}
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-blue-50">
              {formatNumber(data?.totalCnpjs || 0)} CNPJs
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              {formatNumber(totalFuncionarios)} funcionários
            </Badge>
            <Badge variant="outline" className="bg-emerald-50">
              {formatCurrency(totalValor)} total
            </Badge>
          </div>
        </div>

        {/* Filtros e controles */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por CNPJ ou razão social..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('funcionarios_count')}
              className={`${sortField === 'funcionarios_count' ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              Funcionários
              {sortField === 'funcionarios_count' && (
                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('valor_mensal')}
              className={`${sortField === 'valor_mensal' ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              Valor
              {sortField === 'valor_mensal' && (
                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('razao_social')}
              className={`${sortField === 'razao_social' ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              Nome
              {sortField === 'razao_social' && (
                sortDirection === 'asc' ? <SortAsc className="h-4 w-4 ml-1" /> : <SortDesc className="h-4 w-4 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="p-0">
        <CnpjCostTable data={processedData} loading={loading} />
      </div>

      {/* Footer com estatísticas */}
      {processedData.length > 0 && (
        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Exibindo {processedData.length} de {data?.custosPorCnpj?.length || 0} CNPJs
            </span>
            <div className="flex items-center gap-4">
              <span>Total de funcionários: <strong>{formatNumber(totalFuncionarios)}</strong></span>
              <span>Valor total mensal: <strong className="text-green-600">{formatCurrency(totalValor)}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Versão simplificada da tabela
export function SimpleTableSection({ data, loading }: TableSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">CNPJs Cadastrados</h3>
        </div>
      </div>
      
      <CnpjCostTable data={data?.custosPorCnpj || []} loading={loading} />
    </div>
  );
}
