import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

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

  // Determinar qual empresa_id usar: parâmetro passado ou do AuthContext
  const targetEmpresaId = paramEmpresaId || empresaId;

  // Query para buscar funcionários com dados do CNPJ e plano
  const funcionariosQuery = useQuery({
    queryKey: ['funcionarios', user?.id, search, page, pageSize, cnpj_id, targetEmpresaId, statusFilter],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.log('🔍 Buscando funcionários - Parâmetros:', { 
        cnpj_id, 
        targetEmpresaId, 
        statusFilter, 
        search,
        empresaIdFromAuth: empresaId 
      });

      // Se cnpj_id foi fornecido, usar diretamente
      if (cnpj_id) {
        let query = supabase
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
          `, { count: 'exact' })
          .eq('cnpj_id', cnpj_id);

        // Aplicar filtro de status se fornecido
        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter as any);
        } else {
          // Status padrão quando não há filtro específico
          query = query.in('status', ['ativo', 'pendente', 'exclusao_solicitada']);
        }

        query = query.order('nome');

        if (search) {
          query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        const start = page * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ Erro ao buscar funcionários por CNPJ:', error);
          throw error;
        }

        // Transformar dados para incluir plano
        const funcionariosTransformados = (data || []).map((funcionario: any) => {
          console.log('🔄 Transformando funcionário:', funcionario.nome, 'Plano raw:', funcionario.cnpj?.dados_planos);
          
          const planoData = funcionario.cnpj?.dados_planos?.[0] || null;
          console.log('📋 Dados do plano processados:', planoData);

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

        console.log('✅ Funcionários transformados:', funcionariosTransformados.length);
        console.log('📊 Primeiro funcionário com plano:', funcionariosTransformados.find(f => f.plano));

        return {
          funcionarios: funcionariosTransformados as FuncionarioWithCnpj[],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      }

      // Se targetEmpresaId foi fornecido (para página de detalhes da empresa ou empresa logada)
      if (targetEmpresaId) {
        console.log('🏢 Usando empresa_id do contexto:', targetEmpresaId);
        
        let query = supabase
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
          `, { count: 'exact' })
          .eq('cnpjs.empresa_id', targetEmpresaId);

        // Aplicar filtro de status se fornecido
        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('status', statusFilter as any);
        } else {
          // Status padrão quando não há filtro específico
          query = query.in('status', ['ativo', 'pendente', 'exclusao_solicitada']);
        }

        query = query.order('nome');

        if (search) {
          query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%`);
        }

        const start = page * pageSize;
        const end = start + pageSize - 1;
        query = query.range(start, end);

        const { data, error, count } = await query;

        if (error) {
          console.error('❌ Erro ao buscar funcionários por empresa:', error);
          throw error;
        }

        // Transformar dados para incluir plano
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

        console.log('✅ Funcionários da empresa encontrados:', funcionariosTransformados.length, 'de', count || 0);

        return {
          funcionarios: funcionariosTransformados as FuncionarioWithCnpj[],
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      }

      // Fallback: se não temos empresa_id, retornar vazio
      console.warn('⚠️ Nenhum empresa_id disponível para filtrar funcionários');
      return {
        funcionarios: [],
        totalCount: 0,
        totalPages: 0
      };
    },
    enabled: !!user?.id && (!!cnpj_id || !!targetEmpresaId),
  });

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
      toast({
        title: 'Sucesso',
        description: 'Funcionário adicionado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao adicionar funcionário',
        variant: 'destructive',
      });
    },
  });

  // Mutation para atualizar funcionário
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
      toast({
        title: 'Sucesso',
        description: 'Funcionário atualizado com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao atualizar funcionário',
        variant: 'destructive',
      });
    },
  });

  // Mutation para solicitar exclusão de funcionário
  const archiveFuncionario = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .update({ status: 'exclusao_solicitada' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      toast({
        title: 'Sucesso',
        description: 'Solicitação de exclusão enviada com sucesso!',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao solicitar exclusão',
        variant: 'destructive',
      });
    },
  });

  // NOVA: Mutation para aprovar exclusão de funcionário
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
      // CORREÇÃO CRÍTICA: Invalidar TODAS as queries relevantes
      console.log('🔄 Aprovação realizada com sucesso. Invalidando caches...');
      
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Também invalidar outras possíveis queries de dashboard
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['empresaDashboard'] });
      
      toast({
        title: 'Sucesso',
        description: data?.message || 'Exclusão aprovada com sucesso!',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao aprovar exclusão:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar exclusão',
        variant: 'destructive',
      });
    },
  });

  // NOVA: Mutation para negar exclusão de funcionário
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
      // CORREÇÃO CRÍTICA: Invalidar TODAS as queries relevantes
      console.log('🔄 Negação realizada com sucesso. Invalidando caches...');
      
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Também invalidar outras possíveis queries de dashboard
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['empresaDashboard'] });
      
      toast({
        title: 'Sucesso',
        description: data?.message || 'Exclusão negada - funcionário reativado!',
      });
    },
    onError: (error) => {
      console.error('❌ Erro ao negar exclusão:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao negar exclusão',
        variant: 'destructive',
      });
    },
  });

  return {
    funcionarios: funcionariosQuery.data?.funcionarios || [],
    totalCount: funcionariosQuery.data?.totalCount || 0,
    totalPages: funcionariosQuery.data?.totalPages || 0,
    isLoading: funcionariosQuery.isLoading,
    error: funcionariosQuery.error,
    addFuncionario,
    updateFuncionario,
    archiveFuncionario,
    approveExclusao,
    denyExclusao,
  };
};
