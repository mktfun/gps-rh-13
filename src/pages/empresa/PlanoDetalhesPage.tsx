
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import Breadcrumbs from '@/components/ui/breadcrumbs';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { AdicionarFuncionarioModal } from '@/components/empresa/AdicionarFuncionarioModal';
import { 
  Shield, 
  Building2, 
  FileText, 
  AlertTriangle, 
  Users, 
  UserCheck, 
  Clock, 
  DollarSign, 
  Plus,
  Edit,
  Download,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

const PlanoDetalhesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
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

  const handleExportReport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

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

  const breadcrumbItems = [
    { label: 'Planos', href: '/empresa/planos', icon: Shield },
    { label: `Detalhes: ${plano.seguradora}` }
  ];

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumbs */}
      <div className="mb-6">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Layout Principal - Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Coluna Esquerda - Fixa/Sticky (30%) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Resumo do Plano */}
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Resumo do Plano
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Seguradora</label>
                  <Badge variant="secondary" className="block w-fit">
                    {plano.seguradora}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Empresa</label>
                  <p className="text-sm font-medium">{plano.empresa_nome}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Valor Mensal</label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(plano.valor_mensal)}
                  </p>
                </div>
              </div>
              
              {/* KPIs */}
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium text-sm">Estatísticas</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg border">
                    <UserCheck className="h-4 w-4 mx-auto text-green-600 mb-1" />
                    <div className="text-lg font-bold text-green-600">
                      {stats?.ativos || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Ativos</div>
                  </div>
                  
                  <div className="text-center p-3 bg-yellow-50 rounded-lg border">
                    <Clock className="h-4 w-4 mx-auto text-yellow-600 mb-1" />
                    <div className="text-lg font-bold text-yellow-600">
                      {stats?.pendentes || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Pendentes</div>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 rounded-lg border">
                    <Users className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                    <div className="text-lg font-bold text-blue-600">
                      {stats?.total || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  
                  <div className="text-center p-3 bg-purple-50 rounded-lg border">
                    <DollarSign className="h-4 w-4 mx-auto text-purple-600 mb-1" />
                    <div className="text-sm font-bold text-purple-600">
                      {formatCurrency(stats?.custoPorFuncionario || 0)}
                    </div>
                    <div className="text-xs text-muted-foreground">Por Func.</div>
                  </div>
                </div>
              </div>

              {/* Ações Rápidas */}
              <div className="pt-4 border-t space-y-2">
                <h4 className="font-medium text-sm mb-3">Ações Rápidas</h4>
                
                <Button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Funcionário
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="sm"
                  onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar Plano
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  size="sm"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Relatório
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita - Conteúdo Principal (70%) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gerenciamento do Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="funcionarios">
                    <Users className="h-4 w-4 mr-2" />
                    Funcionários
                  </TabsTrigger>
                  <TabsTrigger value="informacoes">
                    <Building2 className="h-4 w-4 mr-2" />
                    Informações
                  </TabsTrigger>
                  <TabsTrigger value="coberturas">
                    <Shield className="h-4 w-4 mr-2" />
                    Coberturas
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funcionarios" className="mt-6">
                  <PlanoFuncionariosTab 
                    cnpjId={plano.cnpj_id}
                    plano={{
                      id: plano.id,
                      seguradora: plano.seguradora,
                      valor_mensal: plano.valor_mensal
                    }}
                  />
                </TabsContent>

                <TabsContent value="informacoes" className="mt-6">
                  <InformacoesGeraisTab plano={plano} />
                </TabsContent>

                <TabsContent value="coberturas" className="mt-6">
                  <CoberturasTab plano={plano} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal para Adicionar Funcionário */}
      <AdicionarFuncionarioModal
        cnpjId={plano.cnpj_id}
        planoSeguradora={plano.seguradora}
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onFuncionarioAdded={() => {
          // Refresh será feito automaticamente pelo React Query
          toast.success('Funcionário adicionado com sucesso!');
        }}
      />
    </div>
  );
};

export default PlanoDetalhesPage;
