import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { useFuncionariosEmpresa } from '@/hooks/useFuncionariosEmpresa';

type Funcionario = Tables<'funcionarios'>;
type FuncionarioInsert = TablesInsert<'funcionarios'>;
type FuncionarioUpdate = TablesUpdate<'funcionarios'>;

interface FuncionarioWithCnpj extends Funcionario {
  cnpj?: {
    razao_social: string;
    cnpj: string;
  };
  plano?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
  };
  planoSaude?: {
    seguradora: string;
    valor_mensal: number;
  };
  planoVida?: {
    seguradora: string;
    valor_mensal: number;
    cobertura_morte: number;
  };
}

interface UseFuncionariosParams {
  search?: string;
  page?: number;
  pageSize?: number;
  cnpj_id?: string;
  empresaId?: string;
  statusFilter?: string;
}

// Interface para o retorno da RPC resolver_exclusao_funcionario
interface ResolverExclusaoResponse {
  success: boolean;
  message?: string;
  error?: string;
  funcionario?: {
    id: string;
    nome: string;
    empresa: string;
    novo_status: string;
  };
}

export const useFuncionarios = (params: UseFuncionariosParams = {}) => {
  const { user, empresaId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { search = '', page = 0, pageSize = 10, cnpj_id, empresaId: paramEmpresaId, statusFilter } = params;

  console.log('🔍 [useFuncionarios] Hook called with params:', params);

  // Determinar qual empresa_id usar: parâmetro passado ou do AuthContext
  const targetEmpresaId = paramEmpresaId || empresaId;

  // Criar todas as mutations no nível superior para evitar problemas de hook order
  const addFuncionario = useMutation({
    mutationFn: async (funcionario: FuncionarioInsert) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('funcionarios')
        .insert(funcionario)
        .select(`
          *,
          cnpj:cnpjs!inner(
            razao_social,
            cnpj
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      toast({
        title: 'Sucesso',
        description: 'Funcionário adicionado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar funcionário',
        variant: 'destructive',
      });
    },
  });

  const updateFuncionario = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: FuncionarioUpdate }) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          cnpj:cnpjs!inner(
            razao_social,
            cnpj
          )
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      toast({
        title: 'Sucesso',
        description: 'Funcionário atualizado com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar funcionário',
        variant: 'destructive',
      });
    },
  });

  const archiveFuncionario = useMutation({
    mutationFn: async (id: string) => {
      // 1. Update planos_funcionarios first (empresa has RLS permission for this)
      const { data: vinculos, error: fetchError } = await supabase
        .from('planos_funcionarios')
        .select('id')
        .eq('funcionario_id', id);

      if (fetchError) throw fetchError;

      if (vinculos && vinculos.length > 0) {
        const { error: pfError } = await supabase
          .from('planos_funcionarios')
          .update({ status: 'exclusao_solicitada' as any })
          .eq('funcionario_id', id);

        if (pfError) throw pfError;
      }

      // 2. Update funcionarios status (best-effort, may fail due to RLS)
      const { error: funcError } = await supabase
        .from('funcionarios')
        .update({
          status: 'exclusao_solicitada',
          data_solicitacao_exclusao: new Date().toISOString()
        })
        .eq('id', id);

      if (funcError) {
        console.warn('⚠️ Falha ao atualizar funcionarios (RLS), mas planos_funcionarios foi atualizado:', funcError.message);
      }

      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-empresa'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      toast({
        title: 'Sucesso',
        description: 'Solicitação de exclusão enviada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao solicitar exclusão',
        variant: 'destructive',
      });
    },
  });

  const approveExclusao = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const { data, error } = await supabase.rpc('resolver_exclusao_funcionario', {
        p_funcionario_id: funcionarioId,
        p_aprovado: true
      });

      if (error) throw error;
      return data as unknown as ResolverExclusaoResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: 'Sucesso',
        description: data?.message || 'Exclusão aprovada com sucesso!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar exclusão',
        variant: 'destructive',
      });
    },
  });

  const denyExclusao = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const { data, error } = await supabase.rpc('resolver_exclusao_funcionario', {
        p_funcionario_id: funcionarioId,
        p_aprovado: false
      });

      if (error) throw error;
      return data as unknown as ResolverExclusaoResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      toast({
        title: 'Sucesso',
        description: data?.message || 'Exclusão negada - funcionário reativado!',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao negar exclusão',
        variant: 'destructive',
      });
    },
  });

  // Decidir se deve usar RPC da empresa ou query padrão
  const shouldUseEmpresaQuery = targetEmpresaId && !cnpj_id;
  console.log('🎯 [useFuncionarios] Query strategy:', {
    shouldUseEmpresaQuery,
    targetEmpresaId,
    cnpj_id,
    hasTargetEmpresa: !!targetEmpresaId,
    hasCnpjId: !!cnpj_id
  });

  // CORREÇÃO: Usar nova RPC quando empresaId for fornecido
  const empresaQuery = useFuncionariosEmpresa({
    empresaId: shouldUseEmpresaQuery ? (targetEmpresaId || '') : '', // Só passar empresaId se devemos usar essa query
    search,
    statusFilter: statusFilter || 'all',
    pageSize,
    pageNum: page + 1 // RPC usa 1-based, mas nosso sistema usa 0-based
  });

  // Transformar dados da empresa se necessário
  const transformedEmpresaData = shouldUseEmpresaQuery && empresaQuery.data ? {
    funcionarios: empresaQuery.data.funcionarios.map(f => ({
      // Propriedades da interface base Funcionario
      id: f.funcionario_id,
      nome: f.nome,
      cpf: f.cpf,
      cargo: f.cargo,
      salario: f.salario,
      idade: f.idade,
      status: f.status as any,
      data_nascimento: f.data_nascimento,
      estado_civil: f.estado_civil as any,
      email: f.email,
      created_at: f.created_at,
      updated_at: f.updated_at,
      cnpj_id: f.cnpj_id,
      // Propriedades obrigatórias que faltavam
      dados_pendentes: null,
      data_admissao: null,
      data_exclusao: null,
      data_solicitacao_exclusao: null,
      motivo_exclusao: null,
      usuario_executor: null,
      usuario_solicitante: null,
      // Propriedades adicionais da interface FuncionarioWithCnpj
      cnpj: {
        razao_social: f.cnpj_razao_social,
        cnpj: f.cnpj_numero,
      },
      planoSaude: f.plano_saude_seguradora ? {
        seguradora: f.plano_saude_seguradora,
        valor_mensal: f.plano_saude_valor || 0,
      } : undefined,
      planoVida: f.plano_vida_seguradora ? {
        seguradora: f.plano_vida_seguradora,
        valor_mensal: f.plano_vida_valor || 0,
        cobertura_morte: f.plano_vida_cobertura_morte || 0,
      } : undefined
    })) as FuncionarioWithCnpj[],
    totalCount: empresaQuery.data.totalCount,
    totalPages: empresaQuery.data.totalPages,
    currentPage: Math.max(0, empresaQuery.data.currentPage - 1) // Converter de volta para 0-based
  } : null;

  // CORREÇÃO: Query original simplificada para casos específicos (cnpj_id)
  const funcionariosQuery = useQuery({
    queryKey: ['funcionarios', user?.id, search, page, pageSize, cnpj_id, statusFilter],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🔍 [useFuncionarios] Busca por CNPJ específico:', { cnpj_id, statusFilter, search });

      if (!cnpj_id) {
        console.warn('⚠️ [useFuncionarios] Sem cnpj_id ou empresaId');
        return { funcionarios: [], totalCount: 0, totalPages: 0, currentPage: 0 };
      }

      let baseQuery = supabase
        .from('funcionarios')
        .select(`
          *,
          cnpj:cnpjs!inner(
            razao_social,
            cnpj,
            dados_planos(
              seguradora,
              valor_mensal,
              cobertura_morte
            )
          )
        `)
        .eq('cnpj_id', cnpj_id);

      // Aplicar filtro de status
      if (statusFilter && statusFilter !== 'all') {
        baseQuery = baseQuery.eq('status', statusFilter as any);
      } else {
        baseQuery = baseQuery.in('status', ['ativo', 'pendente', 'exclusao_solicitada']);
      }

      if (search) {
        baseQuery = baseQuery.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
      }

      baseQuery = baseQuery.order('nome');

      // Aplicar paginação
      const start = page * pageSize;
      const end = start + pageSize - 1;
      
      const { data, error, count } = await baseQuery.range(start, end);

      if (error) {
        console.error('❌ [useFuncionarios] Erro na query:', error);
        throw error;
      }

      // Transformar dados
      const funcionariosTransformados = (data || []).map((funcionario: any) => {
        const planoData = funcionario.cnpj?.dados_planos?.[0] || null;
        
        return {
          ...funcionario,
          cnpj: {
            razao_social: funcionario.cnpj.razao_social,
            cnpj: funcionario.cnpj.cnpj,
          },
          plano: planoData ? {
            seguradora: planoData.seguradora,
            valor_mensal: planoData.valor_mensal,
            cobertura_morte: planoData.cobertura_morte
          } : null
        };
      });

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        funcionarios: funcionariosTransformados as FuncionarioWithCnpj[],
        totalCount,
        totalPages,
        currentPage: page
      };
    },
    enabled: !!user?.id && !!cnpj_id && !shouldUseEmpresaQuery,
    retry: 2,
    retryDelay: 1000,
  });

  // Retornar dados baseado no tipo de query sendo usado
  if (shouldUseEmpresaQuery) {
    return {
      funcionarios: transformedEmpresaData?.funcionarios || [],
      totalCount: transformedEmpresaData?.totalCount || 0,
      totalPages: transformedEmpresaData?.totalPages || 0,
      currentPage: transformedEmpresaData?.currentPage || 0,
      isLoading: empresaQuery.isLoading,
      error: empresaQuery.error,
      addFuncionario,
      updateFuncionario,
      archiveFuncionario,
      approveExclusao,
      denyExclusao,
    };
  }

  return {
    funcionarios: funcionariosQuery.data?.funcionarios || [],
    totalCount: funcionariosQuery.data?.totalCount || 0,
    totalPages: funcionariosQuery.data?.totalPages || 0,
    currentPage: funcionariosQuery.data?.currentPage || page,
    isLoading: funcionariosQuery.isLoading,
    error: funcionariosQuery.error,
    addFuncionario,
    updateFuncionario,
    archiveFuncionario,
    approveExclusao,
    denyExclusao,
  };
};
