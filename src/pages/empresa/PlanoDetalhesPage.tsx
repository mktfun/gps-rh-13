import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { usePlanoDetalhes } from '@/hooks/usePlanoDetalhes';
import { usePlanoFuncionarios } from '@/hooks/usePlanoFuncionarios';
import { InformacoesGeraisTab } from '@/components/planos/InformacoesGeraisTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { FuncionariosTab } from '@/components/planos/FuncionariosTab';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { AdicionarFuncionarioModal } from '@/components/empresa/AdicionarFuncionarioModal';

const PlanoDetalhesPage = () => {
  const { planoId } = useParams<{ planoId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("informacoes");
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: plano, isLoading: isLoadingPlano, error: errorPlano } = usePlanoDetalhes(planoId!);
  
  const tipoSeguro = (plano?.tipo_seguro as 'vida' | 'saude' | 'outros') || 'vida';
  
  const { data: funcionarios, isLoading: isLoadingFuncionarios } = usePlanoFuncionarios({ 
    cnpjId: plano?.cnpj_id || '', 
    tipoSeguro 
  });

  const navigateToFuncionarios = () => {
    setActiveTab('funcionarios');
  };

  if (isLoadingPlano) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-6 w-64 mb-2" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (errorPlano || !plano) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Plano não encontrado</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{plano.empresa_nome}</h1>
          <p className="text-muted-foreground">
            {plano.cnpj_razao_social} ({plano.cnpj_numero})
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </div>

      <Separator className="mb-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="informacoes">Informações Gerais</TabsTrigger>
          <TabsTrigger value="coberturas">Coberturas</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="demonstrativos">Demonstrativos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="informacoes">
          <InformacoesGeraisTab plano={plano} />
        </TabsContent>
        
        <TabsContent value="coberturas">
          <CoberturasTab plano={plano} />
        </TabsContent>
        
        <TabsContent value="funcionarios">
          <FuncionariosTab 
            funcionarios={funcionarios || []} 
            isLoading={isLoadingFuncionarios}
            plano={{
              ...plano,
              tipo_seguro: tipoSeguro
            }}
          />
        </TabsContent>
        
        <TabsContent value="contrato">
          <ContratoTab planoId={planoId!} />
        </TabsContent>
        
        <TabsContent value="demonstrativos">
          <DemonstrativosTab planoId={planoId!} />
        </TabsContent>
      </Tabs>

      <AdicionarFuncionarioModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        cnpjId={plano.cnpj_id}
        planoSeguradora={plano.seguradora}
        onFuncionarioAdded={() => {
          setShowAddModal(false);
          // Refresh data will happen automatically due to react-query
        }}
      />
    </div>
  );
};

export default PlanoDetalhesPage;
