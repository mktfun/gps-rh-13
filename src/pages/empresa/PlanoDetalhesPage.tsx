
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Shield, Users, DollarSign, Clock, Info, Edit } from 'lucide-react';
import { PlanoInfoCardReadOnly } from '@/components/empresa/PlanoInfoCardReadOnly';
import { PlanoCoberturasCardReadOnly } from '@/components/empresa/PlanoCoberturasCardReadOnly';
import { FuncionariosPlanoDataTable } from '@/components/empresa/FuncionariosPlanoDataTable';
import { SolicitarAlteracaoCoberturasModal } from '@/components/empresa/SolicitarAlteracaoCoberturasModal';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { useEmpresaPlanos } from '@/hooks/useEmpresaPlanos';

const PlanoDetalhesPage = () => {
  const { planoId } = useParams<{ planoId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('informacoes');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [solicitarAlteracaoOpen, setSolicitarAlteracaoOpen] = useState(false);

  // Buscar dados do plano
  const { data: planos } = useEmpresaPlanos();
  const plano = planos?.find(p => p.id === planoId);

  const { data: funcionariosData, isLoading: loadingFuncionarios } = usePlanoFuncionarios({ 
    cnpjId: plano?.cnpj_id || '',
    statusFilter: statusFilter !== 'todos' ? statusFilter : undefined,
    search: search || undefined,
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
  });

  const handleVoltar = () => {
    navigate('/empresa/planos');
  };

  if (!plano) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Plano não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                O plano solicitado não foi encontrado ou você não tem permissão para visualizá-lo.
              </p>
              <Button onClick={handleVoltar} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar aos Planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-8 bg-background">
      {/* Header da Página */}
      <div className="space-y-4">
        <Button 
          onClick={handleVoltar} 
          variant="ghost" 
          size="lg"
          className="mb-4 text-base"
        >
          <ArrowLeft className="mr-3 h-5 w-5" />
          Voltar aos Planos
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Plano de Seguro: {plano.seguradora}
          </h1>
          <p className="text-xl text-muted-foreground">
            CNPJ: {plano.cnpj_numero} • {plano.cnpj_razao_social}
          </p>
        </div>
      </div>

      {/* Cards de KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Total de Funcionários</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{plano.total_funcionarios}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Funcionários vinculados ao plano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Funcionários Ativos</CardTitle>
            <Users className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{plano.funcionarios_ativos}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Com cobertura ativa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Funcionários Pendentes</CardTitle>
            <Clock className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{plano.funcionarios_pendentes}</div>
            <p className="text-sm text-muted-foreground mt-1">
              Aguardando ativação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">Custo Mensal</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(plano.valor_mensal)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Valor fixo por CNPJ
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo com Abas */}
      <Card className="w-full">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="informacoes" className="flex items-center gap-3 text-base">
                <Info className="h-5 w-5" />
                Informações do Plano
              </TabsTrigger>
              <TabsTrigger value="funcionarios" className="flex items-center gap-3 text-base">
                <Users className="h-5 w-5" />
                Funcionários ({funcionariosData?.totalCount || 0})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="px-6 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="informacoes" className="mt-6 space-y-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-muted-foreground text-base">
                    Informações detalhadas e coberturas disponíveis neste plano de seguro
                  </p>
                </div>
                <Button
                  onClick={() => setSolicitarAlteracaoOpen(true)}
                  variant="outline"
                  size="lg"
                  className="text-base"
                >
                  <Edit className="mr-3 h-5 w-5" />
                  Solicitar Alteração
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlanoInfoCardReadOnly plano={plano} />
                <PlanoCoberturasCardReadOnly plano={plano} />
              </div>
            </TabsContent>

            <TabsContent value="funcionarios" className="mt-6">
              <FuncionariosPlanoDataTable
                funcionarios={funcionariosData?.funcionarios || []}
                isLoading={loadingFuncionarios}
                totalCount={funcionariosData?.totalCount || 0}
                totalPages={funcionariosData?.totalPages || 0}
                pagination={pagination}
                setPagination={setPagination}
                search={search}
                setSearch={setSearch}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                plano={{
                  seguradora: plano.seguradora,
                  valor_mensal: plano.valor_mensal,
                  cnpj_id: plano.cnpj_id,
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de Solicitação de Alteração */}
      <SolicitarAlteracaoCoberturasModal
        plano={plano}
        open={solicitarAlteracaoOpen}
        onOpenChange={setSolicitarAlteracaoOpen}
      />
    </div>
  );
};

export default PlanoDetalhesPage;
