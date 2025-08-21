import React, { useState } from 'react';
import { Search, Building2, Grid3X3, List, Plus, Download, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCnpjsComPlanos } from '@/hooks/useCnpjsComPlanos';
import { useEmpresa } from '@/hooks/useEmpresa';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import { CNPJsCardView } from '@/components/empresa/CNPJsCardView';
import { CNPJsListView } from '@/components/empresa/CNPJsListView';
import { CNPJsDashboard } from '@/components/empresa/CNPJsDashboard';
import { CnpjModal } from '@/components/cnpjs/CnpjModal';

const CNPJsPage = () => {
  const { user, empresaId } = useAuth();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [planoFilter, setPlanoFilter] = useState<string>('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCnpj, setEditingCnpj] = useState<any>(null);

  // Buscar empresa do usuário logado
  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresa(empresaId);

  // Buscar CNPJs da empresa
  const { data: cnpjs, isLoading: isLoadingCnpjs, refetch } = useCnpjsComPlanos({
    empresaId: empresaId,
    search,
    filtroPlano: planoFilter === 'todos' ? 'todos' : planoFilter as 'com-plano' | 'sem-plano'
  });

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('todos');
    setPlanoFilter('todos');
  };

  const handleEditCnpj = (cnpj: any) => {
    setEditingCnpj(cnpj);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingCnpj(null);
    refetch();
  };

  const handleExport = () => {
    // TODO: Implementar exportação de dados
    console.log('Exportar CNPJs');
  };

  // Aplicar filtros locais
  const filteredCnpjs = React.useMemo(() => {
    if (!cnpjs) return [];
    
    let filtered = cnpjs;
    
    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(cnpj => cnpj.status === statusFilter);
    }
    
    return filtered;
  }, [cnpjs, statusFilter]);

  if (isLoadingEmpresa || isLoadingCnpjs) {
    return <DashboardLoadingState />;
  }

  if (!empresa) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Empresa não encontrada</p>
        </div>
      </div>
    );
  }

  const hasFiltersApplied = search !== '' || statusFilter !== 'todos' || planoFilter !== 'todos';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Gestão de CNPJs
          </h1>
          <p className="text-muted-foreground">
            Gerencie todas as filiais e CNPJs da sua empresa
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar CNPJ
          </Button>
        </div>
      </div>

      {/* Dashboard de métricas */}
      <CNPJsDashboard cnpjs={filteredCnpjs} />

      {/* Filtros e busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por CNPJ ou razão social..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 lg:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="configuracao">Em Configuração</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={planoFilter} onValueChange={setPlanoFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os planos</SelectItem>
                  <SelectItem value="com-plano">Com plano</SelectItem>
                  <SelectItem value="sem-plano">Sem plano</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">Visualização:</span>
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'cards' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('cards')}
                    className="h-8"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {hasFiltersApplied && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="whitespace-nowrap"
                >
                  Limpar Filtros
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista/Cards de CNPJs */}
      {!filteredCnpjs || filteredCnpjs.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Building2}
              title={search || hasFiltersApplied ? "Nenhum CNPJ encontrado" : "Nenhum CNPJ cadastrado"}
              description={
                search || hasFiltersApplied 
                  ? "Tente ajustar os filtros de busca ou adicionar um novo CNPJ."
                  : "Adicione o primeiro CNPJ da sua empresa para começar a gestão."
              }
              action={{
                label: "Adicionar CNPJ",
                onClick: () => setShowAddModal(true)
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                CNPJs Cadastrados
              </CardTitle>
              <Badge variant="outline" className="bg-blue-50">
                {filteredCnpjs.length} CNPJs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === 'cards' ? (
              <CNPJsCardView 
                cnpjs={filteredCnpjs}
                onEdit={handleEditCnpj}
              />
            ) : (
              <CNPJsListView 
                cnpjs={filteredCnpjs}
                onEdit={handleEditCnpj}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Adicionar/Editar CNPJ */}
      {(showAddModal || editingCnpj) && (
        <CnpjModal
          isOpen={true}
          onClose={handleModalClose}
          cnpj={editingCnpj}
          empresaId={user?.user_metadata?.empresa_id}
        />
      )}
    </div>
  );
};

export default CNPJsPage;
