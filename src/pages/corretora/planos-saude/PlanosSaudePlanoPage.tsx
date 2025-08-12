import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Building2 } from 'lucide-react';
import { useCnpj } from '@/hooks/useCnpj';
import { useEmpresa } from '@/hooks/useEmpresa';
import { EmptyState } from '@/components/ui/empty-state';
import { AlertTriangle, FileText } from 'lucide-react';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { CnpjPlanoStatus } from '@/components/cnpjs/CnpjPlanoStatus';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { usePlanoDetalhesByCnpjAndTipo } from '@/hooks/usePlanoDetalhesByCnpjAndTipo';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';

export interface PlanoProps {
  id: string;
  seguradora: string;
  valor_mensal: number;
}

export const PlanosSaudePlanoPage: React.FC = () => {
  const { empresaId, cnpjId } = useParams<{ empresaId: string; cnpjId: string }>();
  const [activeTab, setActiveTab] = useState('funcionarios');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: cnpjData,
    isLoading: isCnpjLoading,
    error: cnpjError
  } = useCnpj(cnpjId!);

  const {
    data: empresaData,
    isLoading: isEmpresaLoading,
    error: empresaError
  } = useEmpresa(empresaId!);

  const {
    data: planoData,
    isLoading: isPlanoLoading,
    error: planoError
  } = usePlanoDetalhesByCnpjAndTipo(cnpjId!, 'saude');

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

      {/* Status do Plano */}
      <div className="mb-6">
        <CnpjPlanoStatus
          cnpjId={cnpjId!}
          tipoSeguro="saude"
          planoExiste={!!planoData}
          planoDetalhes={planoData ? {
            id: planoData.id,
            seguradora: planoData.seguradora,
            valor_mensal: planoData.valor_mensal_calculado || planoData.valor_mensal,
            total_funcionarios: planoData.total_funcionarios,
            funcionarios_ativos: planoData.funcionarios_ativos,
          } : undefined}
          empresaNome={empresaData?.nome}
          cnpjNumero={cnpjData?.cnpj}
        />
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
              id: planoData?.id || '',
              seguradora: planoData?.seguradora || '',
              valor_mensal: planoData?.valor_mensal || 0,
            }}
            onAddFuncionarios={handleConfigurarPlano}
          />
        </TabsContent>
        <TabsContent value="contrato" className="mt-6">
          <ContratoTab planoId={planoData?.id} isCorretora={true} />
        </TabsContent>
        <TabsContent value="documentos" className="mt-6">
          <DemonstrativosTab planoId={planoData?.id} isCorretora={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
