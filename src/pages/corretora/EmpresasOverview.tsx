import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Grid, List, Building2, Stethoscope, Shield, Users, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useEmpresasComPlanos } from '@/hooks/useEmpresasComPlanos';
import { DashboardLoadingState } from '@/components/ui/loading-state';

interface EmpresaUnificada {
  id: string;
  nome: string;
  planos_saude: number;
  planos_vida: number;
  total_planos: number;
  total_funcionarios: number;
  funcionarios_pendentes: number;
}

export default function EmpresasOverview() {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const navigate = useNavigate();

  // Fetch both health and life plans data
  const { data: empresasSaude = [], isLoading: isLoadingSaude } = useEmpresasComPlanos({ 
    tipoSeguro: 'saude',
    search
  });
  
  const { data: empresasVida = [], isLoading: isLoadingVida } = useEmpresasComPlanos({ 
    tipoSeguro: 'vida',
    search
  });

  const isLoading = isLoadingSaude || isLoadingVida;

  // Combine data from both types of plans
  const empresasUnificadas: EmpresaUnificada[] = React.useMemo(() => {
    const empresasMap = new Map<string, EmpresaUnificada>();
    
    // Add health plans
    empresasSaude.forEach(empresa => {
      empresasMap.set(empresa.id, {
        id: empresa.id,
        nome: empresa.nome,
        planos_saude: empresa.total_planos_ativos,
        planos_vida: 0,
        total_planos: empresa.total_planos_ativos,
        total_funcionarios: 0, // This will be updated with real data
        funcionarios_pendentes: 0 // This will be updated with real data
      });
    });

    // Add life insurance plans
    empresasVida.forEach(empresa => {
      const existing = empresasMap.get(empresa.id);
      if (existing) {
        existing.planos_vida = empresa.total_planos_ativos;
        existing.total_planos = existing.planos_saude + empresa.total_planos_ativos;
      } else {
        empresasMap.set(empresa.id, {
          id: empresa.id,
          nome: empresa.nome,
          planos_saude: 0,
          planos_vida: empresa.total_planos_ativos,
          total_planos: empresa.total_planos_ativos,
          total_funcionarios: 0,
          funcionarios_pendentes: 0
        });
      }
    });

    return Array.from(empresasMap.values());
  }, [empresasSaude, empresasVida]);

  const handleEmpresaClick = (empresa: EmpresaUnificada) => {
    // Navigate to the unified empresa details page
    navigate(`/corretora/empresas/${empresa.id}`);
  };

  const getStatusBadge = (empresa: EmpresaUnificada) => {
    if (empresa.funcionarios_pendentes > 0) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {empresa.funcionarios_pendentes} pendente(s)
        </Badge>
      );
    }
    
    if (empresa.total_planos === 0) {
      return (
        <Badge variant="outline" className="gap-1">
          <Clock className="h-3 w-3" />
          Configuração Pendente
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="gap-1">
        ✓ Ativo
      </Badge>
    );
  };

  const EmpresaCard: React.FC<{ empresa: EmpresaUnificada }> = ({ empresa }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleEmpresaClick(empresa)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span className="text-lg">{empresa.nome}</span>
          </div>
          {getStatusBadge(empresa)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan types summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-blue-900">Planos de Saúde</div>
              <div className="text-blue-600">{empresa.planos_saude}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
            <Shield className="h-4 w-4 text-green-600" />
            <div className="text-sm">
              <div className="font-medium text-green-900">Seguros de Vida</div>
              <div className="text-green-600">{empresa.planos_vida}</div>
            </div>
          </div>
        </div>

        {/* Funcionarios summary */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Total de funcionários:</span>
          </div>
          <Badge variant="outline">
            {empresa.total_funcionarios || 'N/A'}
          </Badge>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/corretora/planos-de-saude/empresas`);
            }}
            disabled={empresa.planos_saude === 0}
          >
            <Stethoscope className="h-3 w-3 mr-1" />
            Saúde
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/corretora/seguros-de-vida/empresas`);
            }}
            disabled={empresa.planos_vida === 0}
          >
            <Shield className="h-3 w-3 mr-1" />
            Vida
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const EmpresaListItem: React.FC<{ empresa: EmpresaUnificada }> = ({ empresa }) => (
    <Card className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => handleEmpresaClick(empresa)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
            <div>
              <h3 className="font-medium">{empresa.nome}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Stethoscope className="h-3 w-3" />
                  {empresa.planos_saude} saúde
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {empresa.planos_vida} vida
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {empresa.total_funcionarios || 'N/A'} funcionários
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {getStatusBadge(empresa)}
            <Button variant="ghost" size="sm">
              Gerenciar →
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Visão Geral das Empresas
          </CardTitle>
          <CardDescription>
            Gerencie todas as empresas e seus planos de saúde e seguros de vida em um só lugar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
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

          {/* Summary stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {empresasUnificadas.reduce((sum, e) => sum + e.planos_saude, 0)}
                </div>
                <div className="text-sm text-blue-700">Planos de Saúde</div>
              </CardContent>
            </Card>
            
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {empresasUnificadas.reduce((sum, e) => sum + e.planos_vida, 0)}
                </div>
                <div className="text-sm text-green-700">Seguros de Vida</div>
              </CardContent>
            </Card>
            
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {empresasUnificadas.length}
                </div>
                <div className="text-sm text-purple-700">Total de Empresas</div>
              </CardContent>
            </Card>
            
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {empresasUnificadas.reduce((sum, e) => sum + e.funcionarios_pendentes, 0)}
                </div>
                <div className="text-sm text-orange-700">Pendências</div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          {empresasUnificadas.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Nenhuma empresa encontrada</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Não há empresas com planos ativos.
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {empresasUnificadas.map((empresa) => (
                <EmpresaCard key={empresa.id} empresa={empresa} />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {empresasUnificadas.map((empresa) => (
                <EmpresaListItem key={empresa.id} empresa={empresa} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
