
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Grid, List, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useCnpjsComPlanos } from '@/hooks/useCnpjsComPlanos';
import { CnpjsCardView } from '@/components/seguros-vida/CnpjsCardView';
import { CnpjsListView } from '@/components/seguros-vida/CnpjsListView';
import { BulkImportModal } from '@/components/import/BulkImportModal';

export default function SegurosVidaEmpresasPage() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCnpj, setSelectedCnpj] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const navigate = useNavigate();

  const { data: cnpjs = [], isLoading } = useCnpjsComPlanos(search);

  const handleCnpjClick = (cnpj: any) => {
    // ✅ CORREÇÃO: Navegar para a rota correta que existe no App.tsx
    console.log('🔗 Navegando para empresa:', cnpj.empresa_id);
    console.log('🎯 Rota correta:', `/corretora/seguros-de-vida/${cnpj.empresa_id}`);
    navigate(`/corretora/seguros-de-vida/${cnpj.empresa_id}`);
  };

  const handleImportClick = (cnpj: any) => {
    setSelectedCnpj(cnpj);
    setShowImportModal(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seguros de Vida - CENTRAL EMBALAGENS</CardTitle>
          <CardDescription>
            Gerencie os planos de seguro de vida por CNPJ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de busca e visualização */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
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
              <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}>
                <ToggleGroupItem value="grid" aria-label="Visualização em grade">
                  <Grid className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="list" aria-label="Visualização em lista">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Conteúdo principal */}
          {viewMode === 'grid' ? (
            <CnpjsCardView
              cnpjs={cnpjs}
              isLoading={isLoading}
              onCnpjClick={handleCnpjClick}
              onImportClick={handleImportClick}
            />
          ) : (
            <CnpjsListView
              cnpjs={cnpjs}
              isLoading={isLoading}
              onCnpjClick={handleCnpjClick}
              onImportClick={handleImportClick}
            />
          )}
        </CardContent>
      </Card>

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
            id: selectedCnpj.plano_id || 'default',
            seguradora: selectedCnpj.seguradora || 'Seguradora',
            valor_mensal: selectedCnpj.valor_mensal || 0
          }}
        />
      )}
    </div>
  );
}
