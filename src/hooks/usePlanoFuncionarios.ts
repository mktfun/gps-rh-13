
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type FuncionarioStatus = Database['public']['Enums']['funcionario_status'];
type EstadoCivil = Database['public']['Enums']['estado_civil'];

// Tipo baseado na tabela real do Supabase
export interface PlanoFuncionario {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  email: string | null;
  cnpj_id: string;
  status: FuncionarioStatus;
  estado_civil: EstadoCivil;
  idade: number;
  created_at: string;
  updated_at: string;
  data_exclusao: string | null;
  data_solicitacao_exclusao: string | null;
  motivo_exclusao: string | null;
  usuario_executor: string | null;
  usuario_solicitante: string | null;
}

interface UsePlanoFuncionariosParams {
  cnpjId: string;
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const usePlanoFuncionarios = ({ 
  cnpjId, 
  statusFilter, 
  search, 
  pageIndex = 0,
  pageSize = 10 
}: UsePlanoFuncionariosParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planoFuncionarios', cnpjId, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      console.log('🔍 usePlanoFuncionarios - Buscando funcionários:', {
        cnpjId,
        statusFilter,
        search,
        pageIndex,
        pageSize
      });

      let query = supabase
        .from('funcionarios')
        .select('*', { count: 'exact' })
        .eq('cnpj_id', cnpjId);

      // Validar se o statusFilter é um valor válido do enum antes de aplicar
      if (statusFilter && statusFilter !== 'todos') {
        const validStatuses: FuncionarioStatus[] = ['ativo', 'pendente', 'desativado', 'exclusao_solicitada', 'pendente_exclusao', 'arquivado', 'edicao_solicitada'];
        
        // Tratar o filtro especial "pendentes" que agrupa pendente + exclusao_solicitada + edicao_solicitada
        if (statusFilter === 'pendentes') {
          query = query.in('status', ['pendente', 'exclusao_solicitada', 'edicao_solicitada'] as FuncionarioStatus[]);
        } else if (validStatuses.includes(statusFilter as FuncionarioStatus)) {
          query = query.eq('status', statusFilter as FuncionarioStatus);
        }
      }

      if (search) {
        query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Aplicar paginação com verificação de range
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      
      // Primeiro, buscar o total de registros para validar a paginação
      const { count: totalCount } = await supabase
        .from('funcionarios')
        .select('*', { count: 'exact', head: true })
        .eq('cnpj_id', cnpjId);

      // Se não há registros, retornar vazio
      if (!totalCount || totalCount === 0) {
        return {
          funcionarios: [],
          totalCount: 0,
          totalPages: 0
        };
      }

      // Verificar se a página solicitada é válida
      const totalPages = Math.ceil(totalCount / pageSize);
      let adjustedPageIndex = pageIndex;
      
      if (pageIndex >= totalPages) {
        adjustedPageIndex = 0; // Volta para a primeira página se exceder
        console.log('⚠️ Página solicitada excede o total, voltando para página 0');
      }

      const adjustedFrom = adjustedPageIndex * pageSize;
      const adjustedTo = adjustedFrom + pageSize - 1;
      
      query = query.range(adjustedFrom, adjustedTo);

      const { data, error, count } = await query.order('nome');

      if (error) {
        console.error('❌ usePlanoFuncionarios - Erro ao buscar funcionários:', error);
        throw error;
      }

      console.log('✅ usePlanoFuncionarios - Funcionários encontrados:', {
        totalRegistros: count,
        paginaAtual: adjustedPageIndex + 1,
        totalPaginas: Math.ceil((count || 0) / pageSize),
        funcionarios: data?.length || 0
      });
      
      return {
        funcionarios: data as PlanoFuncionario[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!cnpjId,
    // Configurações de cache otimizadas para performance
    staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
    gcTime: 1000 * 60 * 10, // 10 minutos - cache mantido na memória
    refetchOnWindowFocus: false, // Não revalidar ao focar na janela
    retry: (failureCount, error) => {
      // Não fazer retry para erros 416 (Range Not Satisfiable)
      if (error?.message?.includes('416')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateFuncionario = useMutation({
    mutationFn: async ({ id, status, dados_pendentes }: { 
      id: string; 
      status: FuncionarioStatus;
      dados_pendentes?: any;
    }) => {
      const updateData: any = { status };
      
      if (dados_pendentes) {
        updateData.dados_pendentes = dados_pendentes;
      }

      const { data, error } = await supabase
        .from('funcionarios')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar funcionário:', error);
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const { data, error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', funcionarioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Funcionário removido do plano com sucesso');
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao remover funcionário');
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    updateFuncionario,
    deleteFuncionario,
  };
};
