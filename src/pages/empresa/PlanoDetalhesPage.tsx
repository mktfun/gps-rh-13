
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { EmptyState } from '@/components/ui/empty-state';
import { DashboardLoadingState } from '@/components/ui/loading-state';
import { Shield, Building2, FileText, DollarSign, Heart, AlertTriangle, Flower2 } from 'lucide-react';

// Importe os novos componentes de aba que você criou
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { FuncionariosTab } from '@/components/planos/FuncionariosTab';

const PlanoDetalhesPage: React.FC = () => {
  const { planoId } = useParams<{ planoId: string }>();
  
  console.log('🔗 Parâmetro planoId capturado da URL:', planoId);
  
  const { data: plano, isLoading, error } = usePlanoDetalhes(planoId);

  if (isLoading) {
    return <DashboardLoadingState />;
  }

  if (error) {
    console.error('🚨 Erro no componente:', error);
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

  // Vamos precisar do número de funcionários aqui depois
  const totalFuncionarios = 2; // Placeholder

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Detalhes do Plano - {plano.seguradora}</h1>
          {/* Botões de ação do topo (ex: fechar) podem vir aqui */}
        </div>

        <Tabs defaultValue="funcionarios" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações Gerais</TabsTrigger>
            <TabsTrigger value="coberturas">Coberturas</TabsTrigger>
            <TabsTrigger value="funcionarios">
              Funcionários ({totalFuncionarios})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4">
            <InformacoesGeraisTab plano={plano} />
          </TabsContent>
          <TabsContent value="coberturas" className="mt-4">
            <CoberturasTab plano={plano} />
          </TabsContent>
          <TabsContent value="funcionarios" className="mt-4">
            <FuncionariosTab plano={plano} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PlanoDetalhesPage;
