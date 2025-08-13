import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useEmpresasComPlanos, EmpresaComPlano } from '@/hooks/useEmpresasComPlanos';
import { EmpresasCardView } from '@/components/seguros-vida/EmpresasCardView';
import { EmpresasListView } from '@/components/seguros-vida/EmpresasListView';
import { PlanosSaudeStatus } from '@/components/planos/PlanosSaudeStatus';

export default function PlanosSaudeEmpresasPage() {
  console.log('🩺 PlanosSaudeEmpresasPage: Componente da corretora carregado');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  const { data: empresas = [], isLoading } = useEmpresasComPlanos({ 
    tipoSeguro: 'saude',
    search
  });

  const handleEmpresaClick = (empresa: EmpresaComPlano) => {
    console.log('🔗 Navegando para empresa:', empresa.id);
    console.log('🎯 Rota correta:', `/corretora/planos-de-saude/${empresa.id}`);
    navigate(`/corretora/planos-de-saude/${empresa.id}`);
  };

  return (
    <div className="space-y-6">
      <PlanosSaudeStatus />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Planos de Saúde - Empresas
          </CardTitle>
          <CardDescription>
            Gerencie os planos de saúde por empresa da sua carteira
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controles de busca e visualização */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome da empresa..."
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
            <EmpresasCardView
              empresas={empresas}
              isLoading={isLoading}
              onEmpresaClick={handleEmpresaClick}
            />
          ) : (
            <EmpresasListView
              empresas={empresas}
              isLoading={isLoading}
              onEmpresaClick={handleEmpresaClick}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
