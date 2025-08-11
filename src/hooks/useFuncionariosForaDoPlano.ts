
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FuncionarioForaDoPlano {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  email: string | null;
  status: string;
  created_at: string;
}

interface UseFuncionariosForaDoPlanoParams {
  planoId: string;
  cnpjId: string;
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const useFuncionariosForaDoPlano = ({ 
  planoId, 
  cnpjId,
  statusFilter = 'ativo',
  search, 
  pageIndex = 0,
  pageSize = 50 
}: UseFuncionariosForaDoPlanoParams) => {
  return useQuery({
    queryKey: ['funcionarios-fora-do-plano', planoId, cnpjId, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      console.log('🔍 useFuncionariosForaDoPlano - Buscando funcionários elegíveis:', { planoId, cnpjId });

      // Primeiro, buscar funcionários que já estão no plano
      const { data: funcionariosNoPlano, error: errorPlano } = await supabase
        .from('planos_funcionarios')
        .select('funcionario_id')
        .eq('plano_id', planoId);

      if (errorPlano) {
        console.error('❌ Erro ao buscar funcionários do plano:', errorPlano);
        throw errorPlano;
      }

      const idsNoPlano = funcionariosNoPlano?.map(pf => pf.funcionario_id) || [];

      // Buscar funcionários da empresa que NÃO estão no plano
      let query = supabase
        .from('funcionarios')
        .select('*', { count: 'exact' })
        .eq('cnpj_id', cnpjId);

      // Filtrar por status
      if (statusFilter && statusFilter !== 'todos') {
        query = query.eq('status', statusFilter);
      }

      // Excluir funcionários que já estão no plano
      if (idsNoPlano.length > 0) {
        query = query.not('id', 'in', `(${idsNoPlano.join(',')})`);
      }

      // Aplicar filtro de busca
      if (search) {
        query = query.or(`nome.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`);
      }

      // Aplicar paginação
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('nome');

      if (error) {
        console.error('❌ useFuncionariosForaDoPlano - Erro ao buscar funcionários:', error);
        throw error;
      }

      console.log('✅ useFuncionariosForaDoPlano - Funcionários elegíveis encontrados:', data?.length || 0);
      
      return {
        funcionarios: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!planoId && !!cnpjId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
