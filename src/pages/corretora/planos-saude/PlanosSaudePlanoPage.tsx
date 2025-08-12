
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useEmpresa } from '@/hooks/useEmpresa';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle, FileText, Shield } from 'lucide-react';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConfigurarPlanoModal } from '@/components/planos/ConfigurarPlanoModal';
import { EmptyStateWithAction } from '@/components/ui/empty-state-with-action';

export interface PlanoProps {
  id: string;
  seguradora: string;
  valor_mensal: number;
}

const PlanosSaudePlanoPage: React.FC = () => {
  const { empresaId, cnpjId } = useParams<{ empresaId: string; cnpjId: string }>();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get CNPJ data
  const {
    data: cnpjData,
    isLoading: isCnpjLoading,
    error: cnpjError
  } = useQuery({
    queryKey: ['cnpj', cnpjId],
    queryFn: async () => {
      if (!cnpjId) throw new Error('CNPJ ID não fornecido');
      
      const { data, error } = await supabase
        .from('cnpjs')
        .select(`
          id,
          cnpj,
          razao_social,
          empresa_id,
          empresas (
            id,
            nome
          )
        `)
        .eq('id', cnpjId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!cnpjId,
  });

  const {
    data: empresaData,
    isLoading: isEmpresaLoading,
    error: empresaError
  } = useEmpresa(empresaId!);

  // Get health plan details
  const {
    data: planoData,
    isLoading: isPlanoLoading,
    error: planoError
  } = useQuery({
    queryKey: ['plano-saude-cnpj', cnpjId],
    queryFn: async () => {
      if (!cnpjId) throw new Error('CNPJ ID não fornecido');
      
      const { data, error } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', 'saude')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!cnpjId,
  });

  const isLoading = isCnpjLoading || isEmpresaLoading || isPlanoLoading;
  const error = cnpjError || empresaError || planoError;

  if (!empresaId || !cnpjId) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresas">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Empresas
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Parâmetros Inválidos"
          description="Os parâmetros da empresa ou CNPJ são inválidos."
        />
      </div>
    );
  }

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresas">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Empresas
          </Button>
        </Link>
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Dados"
          description={error.message || 'Ocorreu um erro ao carregar os dados.'}
        />
      </div>
    );
  }

  if (!cnpjData || !empresaData) {
    return (
      <div className="container mx-auto py-6">
        <Link to="/empresas">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Empresas
          </Button>
        </Link>
        <EmptyState
          icon={FileText}
          title="Dados Não Encontrados"
          description="Os dados da empresa ou CNPJ não foram encontrados."
        />
      </div>
    );
  }

  const handleConfigurarPlano = () => {
    setIsModalOpen(true);
  };

  // If no health plan exists, show the empty state
  if (!planoData) {
    return (
      <div className="container mx-auto py-6">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Link to="/empresas" className="text-sm text-muted-foreground hover:underline">
            Empresas
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <Link to={`/empresa/${empresaId}`} className="text-sm text-muted-foreground hover:underline">
            {empresaData.nome}
          </Link>
          <span className="mx-2 text-muted-foreground">/</span>
          <span className="text-sm font-medium">Plano de Saúde</span>
        </div>

        <EmptyStateWithAction
          icon={Shield}
          title="Plano de saúde não encontrado"
          description="Este CNPJ não possui um plano de saúde cadastrado. Configure um plano agora para começar a gerenciar os funcionários."
          primaryAction={{
            label: "Configurar Plano de Saúde",
            onClick: handleConfigurarPlano
          }}
          secondaryAction={{
            label: "Voltar",
            onClick: () => window.history.back()
          }}
        />

        <ConfigurarPlanoModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          cnpjId={cnpjId}
          tipoSeguro="saude"
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Breadcrumbs */}
      <div className="mb-4">
        <Link to="/empresas" className="text-sm text-muted-foreground hover:underline">
          Empresas
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <Link to={`/empresa/${empresaId}`} className="text-sm text-muted-foreground hover:underline">
          {empresaData.nome}
        </Link>
        <span className="mx-2 text-muted-foreground">/</span>
        <span className="text-sm font-medium">Plano de Saúde</span>
      </div>

      {/* Plan Status Header */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{empresaData.nome}</h2>
            <p className="text-sm text-muted-foreground">
              {cnpjData.razao_social} ({cnpjData.cnpj})
            </p>
            <p className="text-sm mt-1">
              <span className="font-medium">Seguradora:</span> {planoData.seguradora}
            </p>
            <p className="text-sm">
              <span className="font-medium">Valor Mensal:</span> R$ {planoData.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Plano Ativo
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
        </TabsList>
        <TabsContent value="funcionarios" className="mt-6">
          <PlanoFuncionariosTab
            cnpjId={cnpjId!}
            plano={{
              id: planoData.id,
              seguradora: planoData.seguradora,
              valor_mensal: planoData.valor_mensal,
            }}
            onAddFuncionarios={handleConfigurarPlano}
          />
        </TabsContent>
        <TabsContent value="contrato" className="mt-6">
          <ContratoTab planoId={planoData.id} isCorretora={true} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-6">
          <DemonstrativosTab planoId={planoData.id} isCorretora={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanosSaudePlanoPage;
