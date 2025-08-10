import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Building2, Shield, Grid3X3, List, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCnpjsComPlanos } from '@/hooks/useCnpjsComPlanos';
import { useEmpresa } from '@/hooks/useEmpresa';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { CnpjsCardView } from '@/components/seguros-vida/CnpjsCardView';
import { CnpjsListView } from '@/components/seguros-vida/CnpjsListView';
import { BulkImportModal } from '@/components/import/BulkImportModal';

const SegurosVidaCnpjsPage = () => {
  const { empresaId } = useParams<{ empresaId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'cards' | 'list'>('cards');
  const [selectedCnpj, setSelectedCnpj] = React.useState<any>(null);
  const [showImportModal, setShowImportModal] = React.useState(false);
  
  const { data: empresa, isLoading: isLoadingEmpresa } = useEmpresa(empresaId);
  const { data: cnpjs, isLoading: isLoadingCnpjs } = useCnpjsComPlanos({ 
    empresaId: empresaId || '',
    search 
  });

  const handleCnpjClick = (cnpj: any) => {
    console.log('🔗 Navegando para CNPJ:', cnpj.id);
    navigate(`/corretora/seguros-de-vida/${cnpj.id}`);
  };

  const handleImportClick = (cnpj: any) => {
    setSelectedCnpj(cnpj);
    setShowImportModal(true);
  };

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

  // Calcular estatísticas
  const totalCnpjs = cnpjs?.length || 0;
  const cnpjsComPlano = cnpjs?.filter(c => c.temPlano).length || 0;
  const totalPendencias = cnpjs?.reduce((acc, c) => acc + c.totalPendencias, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Seguros de Vida - {empresa.nome}</h1>
          <p className="text-muted-foreground">
            Gerencie os planos de seguro de vida por CNPJ
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{cnpjsComPlano}/{totalCnpjs} com plano</span>
          </div>
          {totalPendencias > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-yellow-500 rounded-full" />
              <span className="text-sm font-medium text-yellow-700">{totalPendencias} pendências</span>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Informações da Empresa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Responsável</p>
              <p className="font-medium">{empresa.responsavel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">E-mail</p>
              <p className="font-medium">{empresa.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Telefone</p>
              <p className="font-medium">{empresa.telefone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por CNPJ ou razão social..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visualização:</span>
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
      </div>

      {!cnpjs || cnpjs.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg text-muted-foreground">
            {search ? 'Nenhum CNPJ encontrado' : 'Nenhum CNPJ cadastrado'}
          </p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Tente ajustar os filtros de busca' : 'Cadastre o primeiro CNPJ para começar'}
          </p>
        </div>
      ) : (
        <>
          {viewMode === 'cards' ? (
            <CnpjsCardView 
              cnpjs={cnpjs} 
              isLoading={isLoadingCnpjs}
              onCnpjClick={handleCnpjClick}
              onImportClick={handleImportClick}
            />
          ) : (
            <CnpjsListView 
              cnpjs={cnpjs} 
              isLoading={isLoadingCnpjs}
              onCnpjClick={handleCnpjClick}
              onImportClick={handleImportClick}
            />
          )}
        </>
      )}

      {/* Modal de Importação */}
      {selectedCnpj && (
        <BulkImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setSelectedCnpj(null);
          }}
          cnpjId={selectedCnpj.id}
          plano={{
            id: selectedCnpj.planoId || 'default',
            seguradora: selectedCnpj.seguradora || 'Seguradora',
            valor_mensal: selectedCnpj.valor_mensal || 0
          }}
        />
      )}
    </div>
  );
};

export default SegurosVidaCnpjsPage;
