
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type StatusMatricula = Database['public']['Enums']['status_matricula'];
type TipoSeguro = Database['public']['Enums']['tipo_seguro'];

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
  planoId?: string; // NOVO: aceita planoId diretamente
  cnpjId?: string; // Torna opcional quando planoId é fornecido
  tipoSeguro?: TipoSeguro; // Torna opcional quando planoId é fornecido
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const usePlanoFuncionarios = ({ 
  planoId,
  cnpjId, 
  tipoSeguro,
  statusFilter = 'todos', // PADRÃO: 'todos' para mostrar todos os funcionários
  search, 
  pageIndex = 0,
  pageSize = 10 
}: UsePlanoFuncionariosParams) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['planoFuncionarios', planoId, cnpjId, tipoSeguro, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      console.log('🔍 usePlanoFuncionarios - Iniciando busca com parâmetros:', {
        planoId,
        cnpjId,
        tipoSeguro,
        statusFilter,
        search,
        pageIndex,
        pageSize
      });

      let resolvedPlanoId = planoId;

      // Se não temos planoId mas temos cnpjId e tipoSeguro, buscar o plano
      if (!resolvedPlanoId && cnpjId && tipoSeguro) {
        console.log('🔍 Buscando plano_id via cnpj_id e tipo_seguro...');
        const { data: planoData, error: planoError } = await supabase
          .from('dados_planos')
          .select('id')
          .eq('cnpj_id', cnpjId)
          .eq('tipo_seguro', tipoSeguro)
          .single();

        if (planoError) {
          console.error('❌ Erro ao buscar plano via cnpj/tipo:', planoError);
          throw new Error(`Plano de ${tipoSeguro} não encontrado para este CNPJ`);
        }

        resolvedPlanoId = planoData.id;
        console.log('✅ Plano encontrado via cnpj/tipo:', resolvedPlanoId);
      }

      if (!resolvedPlanoId) {
        throw new Error('planoId, ou cnpjId + tipoSeguro devem ser fornecidos');
      }

      // Buscar as matrículas com os dados dos funcionários
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
        .eq('plano_id', resolvedPlanoId);

      console.log('🔍 Query base configurada para plano_id:', resolvedPlanoId);

      // Aplicar filtro de status - IMPORTANTE: padrão é mostrar TODOS
      if (statusFilter && statusFilter !== 'todos') {
        console.log('🔍 Aplicando filtro de status:', statusFilter);
        const validStatuses: StatusMatricula[] = ['ativo', 'pendente', 'inativo', 'exclusao_solicitada'];
        
        if (statusFilter === 'pendentes') {
          query = query.in('status', ['pendente', 'exclusao_solicitada'] as StatusMatricula[]);
        } else if (validStatuses.includes(statusFilter as StatusMatricula)) {
          query = query.eq('status', statusFilter as StatusMatricula);
        }
      } else {
        console.log('✅ Sem filtro de status - buscando TODOS os funcionários');
      }

      // Aplicar filtro de busca nos dados do funcionário
      if (search) {
        console.log('🔍 Aplicando filtro de busca:', search);
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
        planoId: resolvedPlanoId,
        totalRegistros: count,
        paginaAtual: pageIndex + 1,
        totalPaginas: Math.ceil((count || 0) / pageSize),
        matriculas: data?.length || 0,
        statusFilter,
        dadosRetornados: data?.map(m => ({ 
          nome: m.funcionarios.nome, 
          status: m.status 
        }))
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
    enabled: !!(planoId || (cnpjId && tipoSeguro)),
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
    mutationFn: async ({ funcionario_id, status, dados_pendentes, plano_id_override }: { 
      funcionario_id: string; 
      status: StatusMatricula;
      dados_pendentes?: any;
      plano_id_override?: string;
    }) => {
      const resolvedPlanoId = plano_id_override || planoId;
      
      if (!resolvedPlanoId && cnpjId && tipoSeguro) {
        // Buscar plano_id se necessário
        const { data: planoData, error: planoError } = await supabase
          .from('dados_planos')
          .select('id')
          .eq('cnpj_id', cnpjId)
          .eq('tipo_seguro', tipoSeguro)
          .single();

        if (planoError) {
          throw new Error(`Plano de ${tipoSeguro} não encontrado`);
        }

        console.log('🔄 Atualizando matrícula via cnpj/tipo:', { funcionario_id, status, plano_id: planoData.id });

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
        return data;
      }

      console.log('🔄 Atualizando matrícula via planoId:', { funcionario_id, status, plano_id: resolvedPlanoId });

      // Atualizar na tabela planos_funcionarios
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .update({ status })
        .match({ 
          plano_id: resolvedPlanoId, 
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
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar matrícula:', error);
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (funcionarioId: string) => {
      const resolvedPlanoId = planoId;
      
      if (!resolvedPlanoId && cnpjId && tipoSeguro) {
        console.log('🗑️ Removendo matrícula via cnpj/tipo:', funcionarioId);

        // Primeiro, buscar o plano_id
        const { data: planoData, error: planoError } = await supabase
          .from('dados_planos')
          .select('id')
          .eq('cnpj_id', cnpjId)
          .eq('tipo_seguro', tipoSeguro)
          .single();

        if (planoError) {
          throw new Error(`Plano de ${tipoSeguro} não encontrado`);
        }

        // Remover da tabela planos_funcionarios
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
      }

      console.log('🗑️ Removendo matrícula via planoId:', funcionarioId, resolvedPlanoId);

      // Remover da tabela planos_funcionarios
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .delete()
        .match({ 
          plano_id: resolvedPlanoId, 
          funcionario_id: funcionarioId 
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success(`Funcionário removido do plano com sucesso`);
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
    },
    onError: (error: any) => {
      toast.error(error?.message || `Erro ao remover funcionário do plano`);
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
