
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface FuncionarioEmpresaCompleto {
  funcionario_id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  status: string;
  idade: number;
  data_nascimento: string;
  estado_civil: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  cnpj_id: string;
  cnpj_razao_social: string;
  cnpj_numero: string;
  plano_seguradora: string | null;
  plano_valor_mensal: number | null;
  plano_cobertura_morte: number | null;
  total_count: number;
}

interface UseFuncionariosEmpresaParams {
  empresaId: string;
  search?: string;
  statusFilter?: string;
  pageSize?: number;
  pageNum?: number;
}

export const useFuncionariosEmpresa = (params: UseFuncionariosEmpresaParams) => {
  const { user } = useAuth();
  const { 
    empresaId, 
    search = '', 
    statusFilter = 'all', 
    pageSize = 10, 
    pageNum = 1 
  } = params;

  return useQuery({
    queryKey: ['funcionarios-empresa-completo', empresaId, search, statusFilter, pageSize, pageNum],
    queryFn: async (): Promise<{
      funcionarios: FuncionarioEmpresaCompleto[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
    }> => {
      if (!user?.id) throw new Error('Usuário não autenticado');
      if (!empresaId) throw new Error('ID da empresa não fornecido');

      console.log('🔍 [useFuncionariosEmpresa] Buscando funcionários via RPC:', { 
        empresaId, 
        search, 
        statusFilter, 
        pageSize, 
        pageNum 
      });

      const { data, error } = await supabase.rpc('get_funcionarios_empresa_completo', {
        p_empresa_id: empresaId,
        p_search_term: search || null,
        p_status_filter: statusFilter,
        p_page_size: pageSize,
        p_page_num: pageNum
      });

      if (error) {
        console.error('❌ [useFuncionariosEmpresa] Erro na RPC:', error);
        throw error;
      }

      const funcionarios = (data || []) as FuncionarioEmpresaCompleto[];
      const totalCount = funcionarios.length > 0 ? funcionarios[0].total_count : 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      console.log('✅ [useFuncionariosEmpresa] Resultado:', {
        funcionarios: funcionarios.length,
        totalCount,
        totalPages,
        currentPage: pageNum
      });

      return {
        funcionarios,
        totalCount,
        totalPages,
        currentPage: pageNum
      };
    },
    enabled: !!user?.id && !!empresaId,
    retry: 2,
    retryDelay: 1000,
  });
};
