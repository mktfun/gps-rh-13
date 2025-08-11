
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

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
}

interface UsePlanoFuncionariosParams {
  cnpjId: string;
  tipoSeguro: 'vida' | 'saude' | 'outros';
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const usePlanoFuncionarios = ({ 
  cnpjId, 
  tipoSeguro,
  statusFilter, 
  search, 
  pageIndex = 0,
  pageSize = 10 
}: UsePlanoFuncionariosParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planoFuncionarios', cnpjId, tipoSeguro, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      console.log('🔍 usePlanoFuncionarios - Buscando funcionários via planos_funcionarios:', {
        cnpjId,
        tipoSeguro,
        statusFilter,
        search,
        pageIndex,
        pageSize
      });

      // Primeiro, buscar o plano_id baseado no cnpj_id e tipo correto
      const { data: planoData, error: planoError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', tipoSeguro)
        .maybeSingle();

      if (planoError) {
        console.error('❌ Erro ao buscar plano:', planoError);
        throw planoError;
      }

      // Se não há plano, retornar resultados vazios
      if (!planoData?.id) {
        console.log('⚠️ Nenhum plano encontrado para tipo:', tipoSeguro, 'cnpjId:', cnpjId);
        return {
          funcionarios: [],
          totalCount: 0,
          totalPages: 0
        };
      }

      const planoId = planoData.id;

      // Agora buscar as matrículas com os dados dos funcionários
      let query = supabase
        .from('planos_funcionarios')
        .select(`
          id,
          status,
          funcionarios!inner (
            id,
            nome,
            cpf,
            data_nascimento,
            cargo,
            salario,
            email,
            cnpj_id,
            idade,
            created_at
          )
        `, { count: 'exact' })
        .eq('plano_id', planoId);

      // Aplicar filtro de status
      if (statusFilter && statusFilter !== 'todos') {
        const validStatuses: StatusMatricula[] = ['ativo', 'pendente', 'inativo', 'exclusao_solicitada'];
        
        if (statusFilter === 'pendentes') {
          query = query.in('status', ['pendente', 'exclusao_solicitada'] as StatusMatricula[]);
        } else if (validStatuses.includes(statusFilter as StatusMatricula)) {
          query = query.eq('status', statusFilter as StatusMatricula);
        }
      }

      // Aplicar filtro de busca nos dados do funcionário
      if (search) {
        query = query.or(`funcionarios.nome.ilike.%${search}%,funcionarios.cpf.ilike.%${search}%,funcionarios.email.ilike.%${search}%`);
      }

      // Aplicar paginação
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('funcionarios(nome)');

      if (error) {
        console.error('❌ usePlanoFuncionarios - Erro ao buscar matrículas:', error);
        throw error;
      }

      console.log('✅ usePlanoFuncionarios - Matrículas encontradas:', {
        totalRegistros: count,
        paginaAtual: pageIndex + 1,
        totalPaginas: Math.ceil((count || 0) / pageSize),
        matriculas: data?.length || 0
      });

      // Transformar os dados para o formato esperado
      const funcionarios: PlanoFuncionario[] = (data || []).map((matricula: any) => ({
        id: matricula.funcionarios.id,
        nome: matricula.funcionarios.nome,
        cpf: matricula.funcionarios.cpf,
        data_nascimento: matricula.funcionarios.data_nascimento,
        cargo: matricula.funcionarios.cargo,
        salario: matricula.funcionarios.salario,
        email: matricula.funcionarios.email,
        cnpj_id: matricula.funcionarios.cnpj_id,
        status: matricula.status,
        idade: matricula.funcionarios.idade,
        created_at: matricula.funcionarios.created_at,
        matricula_id: matricula.id,
        funcionario_id: matricula.funcionarios.id
      }));
      
      return {
        funcionarios,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!cnpjId && !!tipoSeguro,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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
      console.log('🔄 Atualizando matrícula:', { funcionario_id, status });

      // Primeiro, buscar o plano_id com o tipo correto
      const { data: planoData, error: planoError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', tipoSeguro)
        .maybeSingle();

      if (planoError) {
        throw planoError;
      }

      if (!planoData?.id) {
        throw new Error(`Plano de ${tipoSeguro} não encontrado para este CNPJ`);
      }

      // Atualizar na tabela planos_funcionarios
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .update({ status })
        .match({ 
          plano_id: planoData.id, 
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
          console.warn('Erro ao atualizar dados pendentes:', funcionarioError);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId, tipoSeguro] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId, tipoSeguro] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar matrícula:', error);
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      console.log('🗑️ Removendo matrícula:', funcionarioId);

      // Primeiro, buscar o plano_id com o tipo correto
      const { data: planoData, error: planoError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', tipoSeguro)
        .maybeSingle();

      if (planoError) {
        throw planoError;
      }

      if (!planoData?.id) {
        throw new Error(`Plano de ${tipoSeguro} não encontrado para este CNPJ`);
      }

      // Remover da tabela planos_funcionarios (não remove o funcionário, só a matrícula)
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .delete()
        .match({ 
          plano_id: planoData.id, 
          funcionario_id: funcionarioId 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Funcionário removido do plano com sucesso');
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId, tipoSeguro] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId, tipoSeguro] });
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
