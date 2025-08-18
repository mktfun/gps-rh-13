import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Shield, FileText, Download } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaPorCnpj } from '@/hooks/useEmpresaPorCnpj';
import { PlanoVisaoGeralTab } from '@/components/seguros-vida/PlanoVisaoGeralTab';
import { PlanoFuncionariosTab } from '@/components/seguros-vida/PlanoFuncionariosTab';
import { PlanoHistoricoTab } from '@/components/seguros-vida/PlanoHistoricoTab';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { EmptyStateWithAction } from '@/components/ui/empty-state-with-action';
import { PendenciasDebugMaster } from '@/components/debug/PendenciasDebugMaster';

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
  const { empresaId, cnpjId } = useParams<{ empresaId: string; cnpjId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  console.log('🔍 SegurosVidaPlanoPage - Empresa ID:', empresaId, 'CNPJ ID:', cnpjId);

  // Check if empresaId is actually a cnpjId that needs autocorrection
  const { data: autocorrectCheck } = useQuery({
    queryKey: ['autocorrect-check-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId || !cnpjId) return null;
      
      // Check if the empresaId is actually a cnpjId
      const { data: cnpjData, error: cnpjError } = await supabase
        .from('cnpjs')
        .select(`
          id,
          empresa_id,
          razao_social,
          cnpj,
          empresas!inner(id, nome)
        `)
        .eq('id', empresaId)
        .maybeSingle();

      if (cnpjData && cnpjData.empresas) {
        console.log('🔄 Autocorrect: EmpresaId is actually a CNPJ, redirecting...');
        return {
          needsRedirect: true,
          correctEmpresaId: cnpjData.empresa_id,
          correctCnpjId: cnpjData.id
        };
      }

      return { needsRedirect: false };
    },
    enabled: !!empresaId && !!cnpjId,
  });

  // Handle autocorrect redirect
  useEffect(() => {
    if (autocorrectCheck?.needsRedirect && !isRedirecting) {
      setIsRedirecting(true);
      toast.info('Redirecionando para a página correta do plano...');
      navigate(`/corretora/seguros-de-vida/${autocorrectCheck.correctEmpresaId}/cnpj/${autocorrectCheck.correctCnpjId}`, { replace: true });
    }
  }, [autocorrectCheck, navigate, isRedirecting]);

  const { data: empresaData, isLoading: isLoadingEmpresa, error: errorEmpresa } = useEmpresaPorCnpj(cnpjId);

  const { data: planoDetalhes, isLoading: isLoadingPlano, error: errorPlano } = useQuery({
    queryKey: ['plano-detalhes-cnpj', cnpjId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!cnpjId) throw new Error('ID do CNPJ não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🔍 Buscando plano de VIDA para CNPJ:', cnpjId);

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
        .eq('tipo_seguro', 'vida') // 🔥 FILTRO MÁGICO ADICIONADO AQUI
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar detalhes do plano de vida:', error);
        throw new Error('Erro ao buscar detalhes do plano de vida');
      }

      if (!data) {
        console.error('❌ Plano de vida não encontrado para CNPJ:', cnpjId);
        throw new Error('Plano de vida não encontrado para este CNPJ');
      }

      console.log('✅ Plano de vida encontrado:', data);

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
    enabled: !!cnpjId && !!user?.id && !autocorrectCheck?.needsRedirect,
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
    enabled: !!cnpjId && !!user?.id && !autocorrectCheck?.needsRedirect,
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

  // Show loading while redirecting
  if (isRedirecting || autocorrectCheck?.needsRedirect) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <Skeleton className="h-4 w-48 mx-auto mb-2" />
              <p className="text-muted-foreground">Redirecionando para a página correta...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <CardContent className="py-12">
            <EmptyStateWithAction
              icon={Shield}
              title="Plano de seguro de vida não encontrado"
              description={
                errorPlano?.message === 'Plano de vida não encontrado para este CNPJ' 
                  ? 'Este CNPJ não possui um plano de seguro de vida cadastrado. Configure um plano agora para começar a gerenciar os funcionários.'
                  : `Erro ao carregar dados: ${errorPlano?.message || errorFuncionarios?.message || errorEmpresa?.message}`
              }
              primaryAction={{
                label: "Configurar Plano de Vida",
                onClick: () => {
                  console.log('🔧 Abrindo modal de configuração de plano de vida para CNPJ:', cnpjId);
                  toast.info('Modal de configuração de plano em desenvolvimento');
                  // TODO: Integrar com modal de criação de plano
                }
              }}
              secondaryAction={{
                label: "Voltar",
                onClick: () => navigate('/corretora/seguros-de-vida')
              }}
            />
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
          <TabsTrigger value="contrato">
            <FileText className="mr-2 h-4 w-4" />
            Contrato
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <Download className="mr-2 h-4 w-4" />
            Documentos
          </TabsTrigger>
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
        
        <TabsContent value="contrato">
          {planoDetalhes && (
            <ContratoTab planoId={planoDetalhes.id} isCorretora={true} />
          )}
        </TabsContent>
        
        <TabsContent value="documentos">
          {planoDetalhes && (
            <DemonstrativosTab planoId={planoDetalhes.id} isCorretora={true} />
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
