
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, History, Settings, Eye } from 'lucide-react';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { PlanoHistoricoTab } from '@/components/seguros-vida/PlanoHistoricoTab';
import { PlanoConfiguracoesTab } from '@/components/seguros-vida/PlanoConfiguracoesTab';
import { PlanoVisaoGeralTab } from '@/components/seguros-vida/PlanoVisaoGeralTab';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

const PlanoDetalhesPage = () => {
  const { cnpjId } = useParams<{ cnpjId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('geral');

  const {
    plano,
    funcionarios,
    cnpjInfo,
    isLoading,
    error
  } = usePlanoDetalhes(cnpjId!);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Erro ao carregar plano</h2>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Erro desconhecido'}
              </p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plano && cnpjInfo) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Plano não configurado</h2>
              <p className="text-muted-foreground mb-4">
                Este CNPJ ainda não possui um plano de seguros configurado.
              </p>
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p><strong>CNPJ:</strong> {cnpjInfo.cnpj}</p>
                <p><strong>Razão Social:</strong> {cnpjInfo.razao_social}</p>
              </div>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plano) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-yellow-600 mb-2">Plano não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                O plano solicitado não foi encontrado no sistema.
              </p>
              <Button onClick={() => navigate(-1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo');
  const funcionariosPendentes = funcionarios.filter(f => f.status === 'pendente');

  const handleNavigateToFuncionarios = () => {
    setActiveTab('funcionarios');
  };

  const handleAddFuncionario = () => {
    setActiveTab('funcionarios');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{plano.empresa_nome}</h1>
            <p className="text-muted-foreground">{plano.cnpj_razao_social}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Seguradora</p>
            <p className="font-medium">{plano.seguradora}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Valor do Plano</p>
            <p className="font-medium text-lg">{formatCurrency(plano.valor_mensal)}</p>
            <p className="text-xs text-muted-foreground">Por CNPJ (fixo)</p>
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Funcionários Ativos</p>
                <p className="text-2xl font-bold text-green-600">{funcionariosAtivos.length}</p>
              </div>
              <Badge variant="secondary">
                <Users className="h-4 w-4 mr-1" />
                Ativos
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{funcionariosPendentes.length}</p>
              </div>
              <Badge variant="outline">
                <Users className="h-4 w-4 mr-1" />
                Pendentes
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Cobertura Morte</p>
              <p className="text-lg font-medium">{formatCurrency(plano.cobertura_morte)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Auxílio Funeral</p>
              <p className="text-lg font-medium">{formatCurrency(plano.cobertura_auxilio_funeral)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="geral" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="funcionarios" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Funcionários
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="mt-6">
          <PlanoVisaoGeralTab 
            plano={plano} 
            funcionarios={funcionarios}
            onNavigateToFuncionarios={handleNavigateToFuncionarios}
            onAddFuncionario={handleAddFuncionario}
          />
        </TabsContent>

        <TabsContent value="funcionarios" className="mt-6">
          <PlanoFuncionariosTab 
            cnpjId={cnpjId!} 
            plano={{
              id: plano.id,
              seguradora: plano.seguradora,
              valor_mensal: plano.valor_mensal
            }}
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-6">
          <PlanoHistoricoTab />
        </TabsContent>

        <TabsContent value="configuracoes" className="mt-6">
          <PlanoConfiguracoesTab plano={plano} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanoDetalhesPage;
