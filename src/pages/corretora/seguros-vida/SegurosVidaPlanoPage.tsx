import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaPorCnpj } from '@/hooks/useEmpresaPorCnpj';
import { PlanoVisaoGeralTab } from '@/components/seguros-vida/PlanoVisaoGeralTab';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { PlanoHistoricoTab } from '@/components/seguros-vida/PlanoHistoricoTab';

interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  empresa_nome: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  tipo_seguro: 'vida' | 'saude' | 'outros';
}

interface FuncionarioPlano {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  data_admissao: string;
  status: string;
  idade: number;
}

const SegurosVidaPlanoPage = () => {
  const { cnpjId } = useParams<{ cnpjId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);

  console.log('🔍 SegurosVidaPlanoPage - CNPJ ID recebido:', cnpjId);

  const { data: empresaData, isLoading: isLoadingEmpresa, error: errorEmpresa } = useEmpresaPorCnpj(cnpjId);

  const { data: planoDetalhes, isLoading: isLoadingPlano, error: errorPlano } = useQuery({
    queryKey: ['plano-detalhes-cnpj', cnpjId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!cnpjId) throw new Error('ID do CNPJ não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🔍 Buscando plano para CNPJ:', cnpjId);

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
        .eq('cnpj_id', cnpjId)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar detalhes do plano:', error);
        throw new Error('Erro ao buscar detalhes do plano');
      }

      if (!data) {
        console.error('❌ Plano não encontrado para CNPJ:', cnpjId);
        throw new Error('Plano não encontrado');
      }

      console.log('✅ Plano encontrado:', data);

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
        tipo_seguro: data.tipo_seguro || 'vida'
      };
    },
    enabled: !!cnpjId && !!user?.id,
  });

  const { data: funcionarios, isLoading: isLoadingFuncionarios, error: errorFuncionarios } = useQuery({
    queryKey: ['funcionarios-cnpj', cnpjId],
    queryFn: async (): Promise<FuncionarioPlano[]> => {
      if (!cnpjId) throw new Error('ID do CNPJ não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('funcionarios')
        .select('*')
        .eq('cnpj_id', cnpjId);

      if (error) {
        console.error('Erro ao buscar funcionários:', error);
        throw new Error('Erro ao buscar funcionários');
      }

      return (data || []).map(funcionario => ({
        id: funcionario.id,
        nome: funcionario.nome,
        cpf: funcionario.cpf,
        email: funcionario.email || '',
        telefone: '',
        data_nascimento: funcionario.data_nascimento,
        cargo: funcionario.cargo,
        salario: funcionario.salario,
        data_admissao: funcionario.created_at,
        status: funcionario.status,
        idade: funcionario.idade
      }));
    },
    enabled: !!cnpjId && !!user?.id,
  });

  const handleAddFuncionario = () => {
    setShouldOpenAddModal(true);
  };

  const handleAddModalHandled = () => {
    setShouldOpenAddModal(false);
  };

  const navigateToFuncionarios = () => {
    setActiveTab('funcionarios');
  };

  if (isLoadingPlano || isLoadingFuncionarios || isLoadingEmpresa) {
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

  if (errorPlano || errorFuncionarios || errorEmpresa) {
    return (
      <div className="container py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Card>
          <CardContent>
            <p className="text-center text-muted-foreground">
              Erro ao carregar dados: {errorPlano?.message || errorFuncionarios?.message || errorEmpresa?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const empresaNome = empresaData?.empresa?.nome || planoDetalhes?.empresa_nome || 'Empresa não encontrada';

  return (
    <div className="container py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{empresaNome}</h1>
          <p className="text-muted-foreground">
            {planoDetalhes?.cnpj_razao_social} ({planoDetalhes?.cnpj_numero})
          </p>
        </div>
        <Button onClick={handleAddFuncionario}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Funcionário
        </Button>
      </div>

      <Separator className="mb-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral">
          {planoDetalhes && (
            <PlanoVisaoGeralTab
              plano={{
                ...planoDetalhes,
                tipo_seguro: planoDetalhes.tipo_seguro || 'vida'
              }}
              funcionarios={funcionarios || []}
              onNavigateToFuncionarios={navigateToFuncionarios}
              onAddFuncionario={handleAddFuncionario}
            />
          )}
        </TabsContent>
        <TabsContent value="funcionarios">
          {planoDetalhes && cnpjId && (
            <PlanoFuncionariosTab 
              cnpjId={cnpjId}
              plano={{
                id: planoDetalhes.id,
                seguradora: planoDetalhes.seguradora,
                valor_mensal: planoDetalhes.valor_mensal
              }}
              shouldOpenAddModal={shouldOpenAddModal}
              onAddModalHandled={handleAddModalHandled}
            />
          )}
        </TabsContent>
        <TabsContent value="historico">
          <PlanoHistoricoTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SegurosVidaPlanoPage;
