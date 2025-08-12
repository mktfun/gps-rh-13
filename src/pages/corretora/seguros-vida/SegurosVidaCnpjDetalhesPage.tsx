
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, FileText, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { useEmpresa } from '@/hooks/useEmpresa';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { ConfigurarPlanoModal } from '@/components/planos/ConfigurarPlanoModal';

const SegurosVidaCnpjDetalhesPage = () => {
  const { empresaId, cnpjId } = useParams<{ empresaId: string; cnpjId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("funcionarios");
  const [isConfigurarModalOpen, setIsConfigurarModalOpen] = useState(false);

  console.log('🔍 SegurosVidaCnpjDetalhesPage - Empresa ID:', empresaId, 'CNPJ ID:', cnpjId);

  if (!empresaId || !cnpjId) {
    return (
      <div className="container py-8">
        <EmptyState
          icon={AlertTriangle}
          title="Parâmetros Inválidos"
          description="Os parâmetros da empresa ou CNPJ são inválidos."
        />
      </div>
    );
  }

  const { data: empresaData, isLoading: isLoadingEmpresa, error: errorEmpresa } = useEmpresa(empresaId);

  // Query local para buscar CNPJ por ID
  const { data: cnpjData, isLoading: isLoadingCnpj, error: errorCnpj } = useQuery({
    queryKey: ['cnpj', cnpjId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cnpjs')
        .select('*')
        .eq('id', cnpjId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!cnpjId,
  });

  // Get plan details for this CNPJ
  const { data: planoData, isLoading: isLoadingPlano, error: errorPlano } = useQuery({
    queryKey: ['plano-vida-cnpj', cnpjId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', 'vida')
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!cnpjId,
  });

  const isLoading = isLoadingEmpresa || isLoadingCnpj || isLoadingPlano;
  const error = errorEmpresa || errorCnpj || errorPlano;

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <EmptyState
          icon={AlertTriangle}
          title="Erro ao Carregar Dados"
          description={error.message || 'Ocorreu um erro ao carregar os dados.'}
        />
      </div>
    );
  }

  if (!empresaData || !cnpjData) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <EmptyState
          icon={FileText}
          title="Dados Não Encontrados"
          description="Os dados da empresa ou CNPJ não foram encontrados."
        />
      </div>
    );
  }

  const handleConfigurarPlano = () => {
    setIsConfigurarModalOpen(true);
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{empresaData.nome}</h1>
          <p className="text-muted-foreground">
            {cnpjData.razao_social} ({cnpjData.cnpj})
          </p>
        </div>
      </div>

      {/* Plan Status */}
      <div className="mb-6 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Status do Plano de Vida</h2>
            {planoData ? (
              <div className="mt-2">
                <p className="text-sm">
                  <span className="font-medium">Seguradora:</span> {planoData.seguradora}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Valor Mensal:</span> R$ {planoData.valor_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="mt-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Plano Ativo
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Nenhum plano de vida configurado</p>
                <div className="mt-2">
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Plano Não Configurado
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            {!planoData && (
              <Button onClick={handleConfigurarPlano}>
                <Plus className="mr-2 h-4 w-4" />
                Configurar Plano
              </Button>
            )}
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
            cnpjId={cnpjId}
            plano={planoData ? {
              id: planoData.id,
              seguradora: planoData.seguradora,
              valor_mensal: planoData.valor_mensal,
            } : undefined}
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

      <ConfigurarPlanoModal
        open={isConfigurarModalOpen}
        onOpenChange={setIsConfigurarModalOpen}
        cnpjId={cnpjId}
        tipoSeguro="vida"
      />
    </div>
  );
};

export default SegurosVidaCnpjDetalhesPage;
