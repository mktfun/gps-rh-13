import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';

export interface CustosReportFiltersData {
  cnpjSearch: string;
  statusFilter: string;
  valorMin: string;
  valorMax: string;
  tipoPlanoFilter: string;
}

interface CustosReportFiltersProps {
  filters: CustosReportFiltersData;
  onFiltersChange: (filters: CustosReportFiltersData) => void;
  cnpjOptions: Array<{ value: string; label: string; }>;
  isLoading?: boolean;
}

export const CustosReportFilters = ({
  filters,
  onFiltersChange,
  cnpjOptions,
  isLoading = false
}: CustosReportFiltersProps) => {
  const updateFilter = (key: keyof CustosReportFiltersData, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      cnpjSearch: '',
      statusFilter: 'todos',
      valorMin: '',
      valorMax: '',
      tipoPlanoFilter: 'todos'
    });
  };

  const hasActiveFilters = filters.cnpjSearch !== '' ||
    (filters.statusFilter !== '' && filters.statusFilter !== 'todos') ||
    filters.valorMin !== '' ||
    filters.valorMax !== '' ||
    (filters.tipoPlanoFilter !== '' && filters.tipoPlanoFilter !== 'todos');

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Filtro por CNPJ/Razão Social */}
          <div className="space-y-2">
            <Label htmlFor="cnpj-search">CNPJ/Razão Social</Label>
            <Input
              id="cnpj-search"
              placeholder="Digite para buscar..."
              value={filters.cnpjSearch}
              onChange={(e) => updateFilter('cnpjSearch', e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Filtro por Status */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select
              value={filters.statusFilter}
              onValueChange={(value) => updateFilter('statusFilter', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Valor Mínimo */}
          <div className="space-y-2">
            <Label htmlFor="valor-min">Valor Min. (R$)</Label>
            <Input
              id="valor-min"
              type="number"
              placeholder="0,00"
              value={filters.valorMin}
              onChange={(e) => updateFilter('valorMin', e.target.value)}
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          {/* Filtro por Valor Máximo */}
          <div className="space-y-2">
            <Label htmlFor="valor-max">Valor Max. (R$)</Label>
            <Input
              id="valor-max"
              type="number"
              placeholder="9999,00"
              value={filters.valorMax}
              onChange={(e) => updateFilter('valorMax', e.target.value)}
              disabled={isLoading}
              min="0"
              step="0.01"
            />
          </div>

          {/* Filtro por Tipo de Plano */}
          <div className="space-y-2">
            <Label htmlFor="tipo-plano-filter">Tipo de Plano</Label>
            <Select
              value={filters.tipoPlanoFilter}
              onValueChange={(value) => updateFilter('tipoPlanoFilter', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os tipos</SelectItem>
                <SelectItem value="vida">Seguro de Vida</SelectItem>
                <SelectItem value="saude">Plano de Saúde</SelectItem>
                <SelectItem value="ambos">Ambos os Planos</SelectItem>
                <SelectItem value="sem_plano">Sem Plano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="gap-2"
              disabled={isLoading}
            >
              <X className="h-3 w-3" />
              Limpar Filtros
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
