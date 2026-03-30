
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';

type StatusMatricula = Database['public']['Enums']['status_matricula'];

// Tipo atualizado baseado na nova estrutura com planos_funcionarios
export interface PlanoFuncionario {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  email: string | null;
  cnpj_id: string;
  status: StatusMatricula;
  idade: number;
  created_at: string;
  matricula_id: string; // ID da matrícula na tabela planos_funcionarios
  funcionario_id: string; // ID real do funcionário
  custo_individual?: number; // Custo mensal do funcionário baseado na faixa etária
}

interface UsePlanoFuncionariosParams {
  planoId: string;
  tipoSeguro: string;
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const usePlanoFuncionarios = ({ 
  planoId,
  tipoSeguro,
  statusFilter, 
  search, 
  pageIndex = 0,
  pageSize = 10 
}: UsePlanoFuncionariosParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planoFuncionarios', tipoSeguro, planoId, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      logger.info('🔍 usePlanoFuncionarios - Buscando funcionários via RPC:', {
        planoId,
        tipoSeguro,
        statusFilter,
        search,
        pageIndex,
        pageSize
      });

      // Usar a RPC com SECURITY INVOKER para respeitar a RLS
      const { data, error } = await supabase.rpc('get_funcionarios_por_plano', {
        p_plano_id: planoId,
        p_status_filter: statusFilter || null,
        p_search: search || null,
        p_page_index: pageIndex,
        p_page_size: pageSize
      });

      if (error) {
        logger.error('❌ usePlanoFuncionarios - Erro ao buscar funcionários via RPC:', error);
        throw error;
      }

      logger.info('✅ usePlanoFuncionarios - Funcionários encontrados via RPC:', {
        totalRegistros: data?.[0]?.total_count || 0,
        paginaAtual: pageIndex + 1,
        funcionarios: data?.length || 0,
        planoId,
        tipoSeguro
      });

      // Pegar o total_count do primeiro registro (todos têm o mesmo valor)
      const totalCount = data?.[0]?.total_count || 0;

      // Transformar os dados para o formato esperado
      const funcionarios: PlanoFuncionario[] = (data || []).map((row: any) => ({
        id: row.funcionario_id,
        nome: row.nome,
        cpf: row.cpf,
        data_nascimento: row.data_nascimento,
        cargo: row.cargo,
        salario: row.salario,
        email: row.email,
        cnpj_id: row.cnpj_id,
        status: row.status as StatusMatricula,
        idade: row.idade,
        created_at: row.created_at,
        matricula_id: row.matricula_id,
        funcionario_id: row.funcionario_id,
        custo_individual: Number(row.custo_individual) || 0
      }));
      
      return {
        funcionarios,
        totalCount: Number(totalCount),
        totalPages: Math.ceil(Number(totalCount) / pageSize)
      };
    },
    enabled: !!planoId && !!tipoSeguro,
    staleTime: 0, // Dados sempre frescos após invalidação
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true, // Refetch ao voltar para a janela
    retry: (failureCount, error) => {
      if (error?.message?.includes('416')) {
        return false;
      }
      return failureCount < 3;
    },
  });

  const updateFuncionario = useMutation({
    mutationFn: async ({ funcionario_id, status, dados_pendentes }: { 
      funcionario_id: string; 
      status: StatusMatricula;
      dados_pendentes?: any;
    }) => {
      logger.info('🔄 Atualizando matrícula:', { funcionario_id, status, planoId, tipoSeguro });

      // Atualizar na tabela planos_funcionarios usando planoId diretamente
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .update({ status })
        .match({ 
          plano_id: planoId, 
          funcionario_id 
        })
        .select()
        .single();

      if (error) throw error;

      // Se houver dados pendentes, atualizar também na tabela funcionarios
      if (dados_pendentes) {
        const { error: funcionarioError } = await supabase
          .from('funcionarios')
          .update({ dados_pendentes })
          .eq('id', funcionario_id);

        if (funcionarioError) {
          logger.warn('Erro ao atualizar dados pendentes:', funcionarioError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', tipoSeguro, planoId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', tipoSeguro, planoId] });
    },
    onError: (error: any) => {
      logger.error('Erro ao atualizar matrícula:', error);
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      logger.info('🗑️ Removendo matrícula:', funcionarioId, 'do plano:', planoId, tipoSeguro);

      // Remover da tabela planos_funcionarios usando planoId diretamente
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .delete()
        .match({ 
          plano_id: planoId, 
          funcionario_id: funcionarioId 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Funcionário removido do plano com sucesso');
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', tipoSeguro, planoId] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', tipoSeguro, planoId] });
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao remover funcionário do plano');
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
