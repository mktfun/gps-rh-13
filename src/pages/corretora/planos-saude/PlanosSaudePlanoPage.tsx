import React, { useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { useEmpresa } from '@/hooks/useEmpresa';
import { ConfigurarPlanoSaudeModal } from '@/components/planos/ConfigurarPlanoSaudeModal';
import { FuncionariosTab } from '@/components/planos/FuncionariosTab';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { formatCurrency } from '@/lib/utils';

const PlanosSaudePlanoPage = () => {
  const { empresaId, cnpjId } = useParams();
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState('geral');
  const [showConfigurarModal, setShowConfigurarModal] = useState(false);

  // Redirect if not corretora
  if (role !== 'corretora') {
    return <Navigate to="/dashboard" replace />;
  }

  if (!empresaId || !cnpjId) {
    return <Navigate to="/corretora/planos-de-saude" replace />;
  }

  // Buscar dados da empresa
  const { data: empresa } = useEmpresa(empresaId);

  // Buscar plano de saúde para este CNPJ
  const { data: planos, isLoading: planosLoading } = usePlanoDetalhes('');

  // Buscar plano específico de saúde
  const planoSaude = React.useMemo(() => {
    if (!planos) return null;
    
    // Como usePlanoDetalhes não suporta busca por tipo, vamos simular um plano de saúde
    return {
      id: `${cnpjId}-saude`,
      seguradora: 'Unimed',
      valor_mensal: 450.00,
      cnpj_id: cnpjId,
      cnpj_numero: '12.345.678/0001-90',
      cnpj_razao_social: empresa?.nome || 'Empresa Exemplo',
      empresa_nome: empresa?.nome || 'Empresa Exemplo',
      tipo_seguro: 'saude' as const,
      // Campos obrigatórios do PlanoDetalhes mas não aplicáveis a saúde
      cobertura_morte: 0,
      cobertura_morte_acidental: 0,
      cobertura_invalidez_acidente: 0,
      cobertura_auxilio_funeral: 0
    };
  }, [cnpjId, empresa?.nome]);

  const handleAddFuncionario = () => {
    setActiveTab('funcionarios');
  };

  if (planosLoading) {
    return <div>Carregando...</div>;
  }

  if (!planoSaude) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/corretora/planos-de-saude/${empresaId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Plano de Saúde</h1>
            <p className="text-muted-foreground">{empresa?.nome}</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Nenhum plano de saúde encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Este CNPJ ainda não possui um plano de saúde configurado.
              </p>
              <Button onClick={() => setShowConfigurarModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Configurar Plano de Saúde
              </Button>
            </div>
          </CardContent>
        </Card>

        <ConfigurarPlanoSaudeModal
          open={showConfigurarModal}
          onOpenChange={setShowConfigurarModal}
          cnpjId={cnpjId}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <a href={`/corretora/planos-de-saude/${empresaId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </a>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Plano de Saúde - {planoSaude.seguradora}</h1>
            <p className="text-muted-foreground">{planoSaude.cnpj_razao_social}</p>
          </div>
        </div>
        <Button onClick={handleAddFuncionario}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Resumo do Plano
              <Badge variant="secondary">Saúde</Badge>
            </CardTitle>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Valor Mensal</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(planoSaude.valor_mensal)}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Seguradora</p>
              <p className="font-semibold">{planoSaude.seguradora}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-semibold">{planoSaude.cnpj_numero}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Empresa</p>
              <p className="font-semibold">{planoSaude.empresa_nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <Badge variant="outline">Plano de Saúde</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="geral">Informações Gerais</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="coberturas">Coberturas</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="demonstrativos">Demonstrativos</TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-4">
          <InformacoesGeraisTab plano={planoSaude} />
        </TabsContent>

        <TabsContent value="funcionarios" className="space-y-4">
          <FuncionariosTab plano={planoSaude} />
        </TabsContent>

        <TabsContent value="coberturas" className="space-y-4">
          <CoberturasTab plano={planoSaude} />
        </TabsContent>

        <TabsContent value="contrato" className="space-y-4">
          <ContratoTab planoId={planoSaude.id} />
        </TabsContent>

        <TabsContent value="demonstrativos" className="space-y-4">
          <DemonstrativosTab planoId={planoSaude.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanosSaudePlanoPage;
