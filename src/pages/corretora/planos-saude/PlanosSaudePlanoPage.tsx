import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Stethoscope, Settings, Edit } from 'lucide-react';
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useEmpresaPorCnpj } from '@/hooks/useEmpresaPorCnpj';
import PlanoVisaoGeralTab from '@/components/seguros-vida/PlanoVisaoGeralTab';
import PlanoFuncionariosTab from '@/components/seguros-vida/PlanoFuncionariosTab';
import { PlanoHistoricoTab } from '@/components/seguros-vida/PlanoHistoricoTab';
import { EmptyStateWithAction } from '@/components/ui/empty-state-with-action';
import { DemonstrativosTab } from '@/components/planos/DemonstrativosTab';
import { ContratoTab } from '@/components/planos/ContratoTab';
import { ConfigurarPlanoSaudeModal } from '@/components/planos/ConfigurarPlanoSaudeModal';
import { EditarPlanoSaudeModal } from '@/components/planos/EditarPlanoSaudeModal';
import { SelecionarFuncionariosModal } from '@/components/planos/SelecionarFuncionariosModal';
import { useQueryClient } from '@tanstack/react-query';

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

const PlanosSaudePlanoPage = () => {
  const { empresaId, cnpjId } = useParams<{ empresaId: string; cnpjId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("visao-geral");
  const [shouldOpenAddModal, setShouldOpenAddModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showConfigurarModal, setShowConfigurarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);

  console.log('🔍 PlanosSaudePlanoPage - Empresa ID:', empresaId, 'CNPJ ID:', cnpjId);

  const { data: autocorrectCheck } = useQuery({
    queryKey: ['autocorrect-check-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId || !cnpjId) return null;
      
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

  useEffect(() => {
    if (autocorrectCheck?.needsRedirect && !isRedirecting) {
      setIsRedirecting(true);
      toast.info('Redirecionando para a página correta do plano...');
      navigate(`/corretora/planos-de-saude/${autocorrectCheck.correctEmpresaId}/cnpj/${autocorrectCheck.correctCnpjId}`, { replace: true });
    }
  }, [autocorrectCheck, navigate, isRedirecting]);

  const { data: empresaData, isLoading: isLoadingEmpresa, error: errorEmpresa } = useEmpresaPorCnpj(cnpjId);

  const { data: planoDetalhes, isLoading: isLoadingPlano, error: errorPlano } = useQuery({
    queryKey: ['plano-detalhes-cnpj-saude', cnpjId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!cnpjId) throw new Error('ID do CNPJ não fornecido');
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🔍 Buscando plano de saúde para CNPJ:', cnpjId);

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
        .eq('tipo_seguro', 'saude')
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar detalhes do plano de saúde:', error);
        throw new Error('Erro ao buscar detalhes do plano de saúde');
      }

      if (!data) {
        console.error('❌ Plano de saúde não encontrado para CNPJ:', cnpjId);
        throw new Error('Plano de saúde não encontrado para este CNPJ');
      }

      console.log('✅ Plano de saúde encontrado:', data);

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
        tipo_seguro: data.tipo_seguro || 'saude'
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

  const handleConfigurarPlano = () => {
    console.log('🔧 Abrindo modal de configuração de plano de saúde para CNPJ:', cnpjId);
    setShowConfigurarModal(true);
  };

  const handleEditarPlano = () => {
    console.log('🔧 Abrindo modal de edição de plano de saúde para CNPJ:', cnpjId);
    setShowEditarModal(true);
  };

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
              icon={Settings}
              title="Plano de saúde não encontrado"
              description={
                errorPlano?.message === 'Plano de saúde não encontrado para este CNPJ' 
                  ? 'Este CNPJ não possui um plano de saúde cadastrado. Configure um plano agora para começar a gerenciar os funcionários.'
                  : `Erro ao carregar dados: ${errorPlano?.message || errorFuncionarios?.message || errorEmpresa?.message}`
              }
              primaryAction={{
                label: "Configurar Plano de Saúde",
                onClick: handleConfigurarPlano
              }}
              secondaryAction={{
                label: "Voltar",
                onClick: () => navigate('/corretora/planos-de-saude/empresas')
              }}
            />
          </CardContent>
        </Card>

        {cnpjId && (
          <ConfigurarPlanoSaudeModal
            open={showConfigurarModal}
            onOpenChange={setShowConfigurarModal}
            cnpjId={cnpjId}
          />
        )}
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Stethoscope className="h-6 w-6" />
            {empresaNome}
          </h1>
          <p className="text-muted-foreground">
            {planoDetalhes?.cnpj_razao_social} ({planoDetalhes?.cnpj_numero})
          </p>
        </div>
        <div className="flex gap-2">
          {planoDetalhes && (
            <Button variant="outline" onClick={handleEditarPlano}>
              <Edit className="mr-2 h-4 w-4" />
              Editar Plano
            </Button>
          )}
          <Button onClick={handleAddFuncionario}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Funcionário
          </Button>
        </div>
      </div>

      <Separator className="mb-4" />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="contrato">Contrato</TabsTrigger>
          <TabsTrigger value="documentos">Demonstrativos e Boletos</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral">
          {planoDetalhes && (
            <PlanoVisaoGeralTab
              planoId={planoDetalhes.id}
            />
          )}
        </TabsContent>

        <TabsContent value="funcionarios">
          {planoDetalhes && cnpjId && (
            <PlanoFuncionariosTab 
              planoId={planoDetalhes.id}
            />
          )}
        </TabsContent>

        <TabsContent value="contrato">
          {planoDetalhes && (
            <ContratoTab planoId={planoDetalhes.id} isCorretora />
          )}
        </TabsContent>

        <TabsContent value="documentos">
          {planoDetalhes && (
            <DemonstrativosTab planoId={planoDetalhes.id} isCorretora />
          )}
        </TabsContent>

        <TabsContent value="historico">
          <PlanoHistoricoTab />
        </TabsContent>
      </Tabs>

      {cnpjId && (
        <>
          <ConfigurarPlanoSaudeModal
            open={showConfigurarModal}
            onOpenChange={setShowConfigurarModal}
            cnpjId={cnpjId}
          />
          <EditarPlanoSaudeModal
            open={showEditarModal}
            onOpenChange={setShowEditarModal}
            plano={planoDetalhes ? {
              id: planoDetalhes.id,
              seguradora: planoDetalhes.seguradora,
              cnpj_razao_social: planoDetalhes.cnpj_razao_social
            } : null}
          />
          {planoDetalhes && (
            <SelecionarFuncionariosModal
              isOpen={shouldOpenAddModal}
              onClose={() => setShouldOpenAddModal(false)}
              cnpjId={cnpjId}
              planoId={planoDetalhes.id}
              onFuncionariosAdicionados={() => {
                queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', planoDetalhes.id] });
                queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', planoDetalhes.id] });
                queryClient.invalidateQueries({ queryKey: ['funcionarios-cnpj', cnpjId] });
                queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano', planoDetalhes.id] });
                setShouldOpenAddModal(false);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default PlanosSaudePlanoPage;
