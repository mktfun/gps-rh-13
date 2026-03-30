import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { usePlanoFuncionariosStats } from '@/hooks/usePlanoFuncionariosStats';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import PlanoFuncionariosTab from '@/components/seguros-vida/PlanoFuncionariosTab';
import { ValoresVidaTable } from '@/components/planos/ValoresVidaTable';
import { SelecionarFuncionariosModal } from '@/components/planos/SelecionarFuncionariosModal';
import {
  Stethoscope,
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
  ArrowLeft,
  Calculator
} from 'lucide-react';
import { toast } from 'sonner';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { logger } from '@/lib/logger';

const PlanoSaudeDetalhesPage: React.FC = () => {
  const { planoId } = useParams<{ planoId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);
  
  const { data: plano, isLoading, error } = usePlanoDetalhes(planoId!);
  
  // Para planos de saúde, usar o valor calculado se disponível
  const valorReal = plano?.tipo_seguro === 'saude' 
    ? (plano?.valor_mensal_calculado ?? plano?.valor_mensal ?? 0)
    : (plano?.valor_mensal ?? 0);
    
  const { data: stats } = usePlanoFuncionariosStats(
    plano?.id || '',
    'saude',
    valorReal
  );

  // Fetch funcionarios data for ValoresVidaTable
  const { data: funcionariosData } = usePlanoFuncionarios({
    planoId: plano?.id || '',
    tipoSeguro: 'saude',
    pageIndex: 0,
    pageSize: 1000 // Get all funcionarios for the table
  });

  // Process funcionarios for ValoresVidaTable (it expects { idade: number, status: string })
  const funcionariosParaTabela = React.useMemo(() => {
    if (!funcionariosData?.funcionarios) return [];

    return funcionariosData.funcionarios.map(f => {
      // Calculate age from data_nascimento if available
      let idade = 30; // default age

      if (f.data_nascimento) {
        const birthDate = new Date(f.data_nascimento);
        const today = new Date();
        idade = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          idade--;
        }
      }

      return {
        idade,
        status: f.status
      };
    });
  }, [funcionariosData]);

  // Debugging específico para plano de saúde
  logger.info('🏠 DEBUGGING PlanoSaudeDetalhesPage:', {
    planoId,
    isLoading,
    error: error?.message,
    plano,
    hasPlano: !!plano,
    valorOriginal: plano?.valor_mensal,
    valorCalculado: plano?.valor_mensal_calculado,
    valorReal,
    tipoSeguro: plano?.tipo_seguro
  });

  const formatCurrency = (value: number, precise = false) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: precise ? 4 : 2,
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
    logger.info('❌ Nenhum planoId fornecido na URL');
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/planos-de-saude">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Planos de Saúde
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
    logger.info('🔄 Mostrando loading state...');
    return <DashboardLoadingState />;
  }

  // Error state - só mostrar se houve erro E não está carregando
  if (error && !isLoading) {
    logger.info('❌ Mostrando error state:', error.message);
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/planos-de-saude">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Planos de Saúde
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

  // Not found state - só mostrar se NÃO está carregando E NÃO há plano E N��O há erro
  if (!isLoading && !plano && !error) {
    logger.info('🔍 Mostrando not found state...');
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresa/planos-de-saude">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Planos de Saúde
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
    logger.info('⚠️ Plano ainda é null/undefined, aguardando...');
    return <DashboardLoadingState />;
  }

  logger.info('✅ Renderizando plano de saúde com sucesso!', plano.seguradora);

  return (
    <div className="container mx-auto py-6">
      {/* Layout Principal - Duas Colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Coluna Esquerda - Fixa/Sticky (30%) */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Stethoscope className="h-5 w-5" />
                Resumo do Plano de Saúde
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
                  <label className="text-sm font-medium text-muted-foreground">Valor Mensal Total</label>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(valorReal)}
                  </p>
                  {plano.tipo_seguro === 'saude' && plano.valor_mensal_calculado !== plano.valor_mensal && (
                    <p className="text-xs text-muted-foreground">
                      * Calculado com base nas faixas etárias
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Seguro</label>
                  <Badge variant="outline" className="block w-fit mt-1">
                    Plano de Saúde
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
                      {formatCurrency(stats?.custoPorFuncionario || 0, true)}
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
                Gerenciamento do Plano de Saúde
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="funcionarios">
                    <Users className="h-4 w-4 mr-2" />
                    Funcionários
                  </TabsTrigger>
                  <TabsTrigger value="valores">
                    <Calculator className="h-4 w-4 mr-2" />
                    Valores
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

                <TabsContent value="valores" className="mt-6">
                  <ValoresVidaTable
                    valorMensal={valorReal}
                    funcionarios={funcionariosParaTabela}
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

      {plano && (
        <SelecionarFuncionariosModal
          isOpen={shouldOpenAddModal}
          onClose={() => setShouldOpenAddModal(false)}
          cnpjId={plano.cnpj_id}
          planoId={plano.id}
          onFuncionariosAdicionados={() => {
            queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', plano.id] });
            queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', plano.id] });
          }}
        />
      )}
    </div>
  );
};

export default PlanoSaudeDetalhesPage;
