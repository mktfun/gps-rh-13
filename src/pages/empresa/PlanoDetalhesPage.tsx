
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { FuncionariosTab } from '@/components/planos/FuncionariosTab';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { 
  Shield, 
  Building2, 
  FileText, 
  DollarSign, 
  Heart, 
  AlertTriangle, 
  Flower2, 
  Users,
  Plus,
  Edit,
  Download,
  ChevronLeft
} from 'lucide-react';

const PlanoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const { data: plano, isLoading, error } = usePlanoDetalhes(id!);
  const { data: stats } = usePlanoFuncionariosStats(
    plano?.cnpj_id || '', 
    plano?.valor_mensal || 0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const breadcrumbItems = [
    { label: 'Planos', href: '/empresa/planos' },
    { 
      label: `Detalhes: ${plano?.seguradora || 'Carregando...'}`,
      icon: Shield
    }
  ];

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Plano"
          description={error instanceof Error ? error.message : 'Ocorreu um erro inesperado'}
        />
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          icon={FileText}
          title="Plano não encontrado"
          description="Não foi possível encontrar os detalhes para este plano."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header com Breadcrumbs */}
      <div className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Breadcrumbs items={breadcrumbItems} />
              <div className="flex items-center gap-3">
                <Link 
                  to="/empresa/planos"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Link>
                <div className="h-4 w-px bg-border" />
                <h1 className="text-2xl font-bold">Gestão do Plano</h1>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              <Shield className="h-3 w-3 mr-1" />
              {plano.seguradora}
            </Badge>
          </div>
        </div>
      </div>

      {/* Layout Principal - Duas Colunas */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">
          
          {/* Coluna Esquerda - Fixa/Sticky (30%) */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-6 space-y-6">
              
              {/* Card de Resumo do Plano */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    Resumo do Plano
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold">{plano.seguradora}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                      <p className="text-sm font-medium mt-1">{plano.empresa_nome}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">CNPJ</label>
                      <div className="flex items-center gap-2 mt-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{plano.cnpj_numero}</span>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <label className="text-sm font-medium text-muted-foreground">Valor do Plano</label>
                      <div className="flex items-center gap-2 mt-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(plano.valor_mensal)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Por CNPJ</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Ativos</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {stats?.ativos || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-muted-foreground">Pendentes</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">
                      {stats?.pendentes || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-muted-foreground">Total</span>
                    </div>
                    <div className="text-2xl font-bold mt-1">
                      {stats?.total || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-muted-foreground">Por Funcionário</span>
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-1">
                      {formatCurrency(stats?.custoPorFuncionario || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full justify-start" 
                    onClick={() => setActiveTab('funcionarios')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Funcionário
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Plano
                  </Button>
                  
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Relatório
                  </Button>
                </CardContent>
              </Card>

            </div>
          </div>

          {/* Coluna Direita - Scrollável (70%) */}
          <div className="lg:col-span-8 xl:col-span-9">
            <Card className="min-h-full">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="border-b px-6 py-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="funcionarios" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Funcionários
                      </TabsTrigger>
                      <TabsTrigger value="informacoes" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Informações Gerais
                      </TabsTrigger>
                      <TabsTrigger value="coberturas" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Coberturas
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  <div className="p-6">
                    <TabsContent value="funcionarios" className="mt-0">
                      <FuncionariosTab plano={plano} />
                    </TabsContent>

                    <TabsContent value="informacoes" className="mt-0">
                      <InformacoesGeraisTab plano={plano} />
                    </TabsContent>

                    <TabsContent value="coberturas" className="mt-0">
                      <CoberturasTab plano={plano} />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PlanoDetalhesPage;
