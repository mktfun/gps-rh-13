import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import PlanoFuncionariosTab from '@/components/seguros-vida/PlanoFuncionariosTab';
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
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';

const SeguroVidaDetalhesPage: React.FC = () => {
  const { planoId } = useParams<{ planoId: string }>();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);
  
  const { data: plano, isLoading, error } = usePlanoDetalhes(planoId!);
  
  // Para seguros de vida, usar sempre o valor original
  const valorReal = plano?.valor_mensal ?? 0;
    
  const { data: stats } = usePlanoFuncionariosStats(
    plano?.id || '', 
    'vida',
    valorReal
  );

  // Debugging específico para seguro de vida
  console.log('🏠 DEBUGGING SeguroVidaDetalhesPage:', {
    planoId,
    isLoading,
    error: error?.message,
    plano,
    hasPlano: !!plano,
    valorReal,
    tipoSeguro: plano?.tipo_seguro
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleExportReport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento');
  };

  const handleAddFuncionarios = () => {
    setShouldOpenAddModal(true);
  };

  const handleAddModalHandled = () => {
    setShouldOpenAddModal(false);
  };

  // Early return if no planoId
  if (!planoId) {
    console.log('�� Nenhum planoId fornecido na URL');
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/seguros-de-vida">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Seguros de Vida
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="ID do Plano Inválido"
          description="Não foi possível identificar o plano a partir da URL."
        />
      </div>
    );
  }

  // Loading state - mostrar enquanto está carregando
  if (isLoading) {
    console.log('🔄 Mostrando loading state...');
    return <DashboardLoadingState />;
  }

  // Error state - só mostrar se houve erro E não está carregando
  if (error && !isLoading) {
    console.log('❌ Mostrando error state:', error.message);
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/seguros-de-vida">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Seguros de Vida
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Plano"
          description={error instanceof Error ? error.message : 'Ocorreu um erro inesperado'}
        />
      </div>
    );
  }

  // Not found state - só mostrar se NÃO está carregando E NÃO há plano E NÃO há erro
  if (!isLoading && !plano && !error) {
    console.log('🔍 Mostrando not found state...');
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/seguros-de-vida">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Seguros de Vida
          </Button>
        </Link>
        <EmptyState
          icon={FileText}
          title="Plano não encontrado"
          description="Não foi possível encontrar os detalhes para este plano."
        />
      </div>
    );
  }

  // Success state - só renderizar se temos plano
  if (!plano) {
    console.log('⚠️ Plano ainda é null/undefined, aguardando...');
    return <DashboardLoadingState />;
  }

  console.log('✅ Renderizando seguro de vida com sucesso!', plano.seguradora);

  return (
    <div className="container mx-auto py-6">
      {/* Layout Principal - Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Coluna Esquerda - Fixa/Sticky (30%) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Resumo do Seguro de Vida
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
                    {formatCurrency(valorReal)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Seguro</label>
                  <Badge variant="outline" className="block w-fit mt-1">
                    Seguro de Vida
                  </Badge>
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
                  onClick={handleAddFuncionarios}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Funcionários
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
                Gerenciamento do Seguro de Vida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="funcionarios">
                    <Users className="h-4 w-4 mr-2" />
                    Funcionários
                  </TabsTrigger>
                  <TabsTrigger value="contrato">
                    <FileText className="h-4 w-4 mr-2" />
                    Contrato
                  </TabsTrigger>
                  <TabsTrigger value="documentos">
                    <Download className="h-4 w-4 mr-2" />
                    Documentos
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="funcionarios" className="mt-6">
                  <PlanoFuncionariosTab 
                    planoId={plano.id}
                  />
                </TabsContent>

                <TabsContent value="contrato" className="mt-6">
                  {plano && <ContratoTab planoId={plano.id} isCorretora={false} />}
                </TabsContent>

                <TabsContent value="documentos" className="mt-6">
                  {plano && <DemonstrativosTab planoId={plano.id} isCorretora={false} />}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SeguroVidaDetalhesPage;
