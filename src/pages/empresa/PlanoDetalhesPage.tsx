import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FuncionariosTab } from '@/components/planos/FuncionariosTab';
import { CoberturasTab } from '@/components/planos/CoberturasTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { ContratoTab } from '@/components/planos/ContratoTab';
import type { PlanoDetalhes } from '@/types/planos';

const PlanoDetalhesPage = () => {
  const { planoId } = useParams<{ planoId: string }>();
  const { empresaId } = useAuth();
  const [activeTab, setActiveTab] = useState("visao-geral");

  const { data: planoDetalhes, isLoading, error } = useQuery({
    queryKey: ['plano-detalhes-empresa', planoId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!planoId) throw new Error('ID do plano não fornecido');
      if (!empresaId) throw new Error('Empresa não identificada');

      console.log('🔍 Buscando detalhes do plano:', planoId);

      const { data, error } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpjs!inner(
            id,
            razao_social,
            cnpj,
            empresa_id,
            empresas (
              nome
            )
          )
        `)
        .eq('id', planoId)
        .eq('cnpjs.empresa_id', empresaId)
        .single();

      if (error) {
        console.error('❌ Erro ao buscar detalhes do plano:', error);
        throw new Error('Erro ao buscar detalhes do plano');
      }

      if (!data) {
        console.error('❌ Plano não encontrado:', planoId);
        throw new Error('Plano não encontrado');
      }

      console.log('✅ Plano encontrado:', data);

      // Garantir que o tipo seja válido
      const tipoSeguroRaw = data.tipo_seguro;
      const tipoSeguro: 'vida' | 'saude' | 'outros' = 
        tipoSeguroRaw === 'vida' || tipoSeguroRaw === 'saude' || tipoSeguroRaw === 'outros' 
          ? tipoSeguroRaw 
          : 'vida';

      return {
        id: data.id,
        cnpj_id: data.cnpj_id,
        empresa_nome: data.cnpjs?.empresas?.nome || 'Nome da Empresa Indisponível',
        cnpj_razao_social: data.cnpjs?.razao_social || 'Razão Social Indisponível',
        cnpj_numero: data.cnpjs?.cnpj || 'CNPJ Indisponível',
        seguradora: data.seguradora,
        valor_mensal: data.valor_mensal,
        cobertura_morte: data.cobertura_morte,
        cobertura_morte_acidental: data.cobertura_morte_acidental,
        cobertura_invalidez_acidente: data.cobertura_invalidez_acidente,
        cobertura_auxilio_funeral: data.cobertura_auxilio_funeral,
        tipo_seguro: tipoSeguro
      };
    },
    enabled: !!planoId && !!empresaId,
  });

  if (isLoading) {
    return (
      <div className="container py-8">
        <Button variant="ghost" className="mb-4">
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

  if (error || !planoDetalhes) {
    return (
      <div className="container py-8">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Erro ao carregar detalhes do plano</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-4">
        <h1 className="text-2xl font-bold">{planoDetalhes.empresa_nome}</h1>
        <p className="text-muted-foreground">
          {planoDetalhes.cnpj_razao_social} ({planoDetalhes.cnpj_numero})
        </p>
      </div>

      <Separator className="mb-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="coberturas">Coberturas</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="documentos">Demonstrativos</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Seguradora</p>
                  <p className="font-semibold">{planoDetalhes.seguradora}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Mensal</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(planoDetalhes.valor_mensal)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-semibold capitalize">{planoDetalhes.tipo_seguro}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="funcionarios">
          <FuncionariosTab plano={planoDetalhes} />
        </TabsContent>

        <TabsContent value="coberturas">
          <CoberturasTab plano={planoDetalhes} />
        </TabsContent>

        <TabsContent value="contrato">
          <ContratoTab planoId={planoDetalhes.id} />
        </TabsContent>

        <TabsContent value="documentos">
          <DemonstrativosTab planoId={planoDetalhes.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanoDetalhesPage;
