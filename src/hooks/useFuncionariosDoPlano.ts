
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export interface FuncionarioDoPlano {
  id: string;
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  email: string | null;
  cnpj_id: string;
  idade: number;
  created_at: string;
  matricula_id: string;
  status_no_plano: Database['public']['Enums']['status_matricula'];
}

interface UseFuncionariosDoPlanoParams {
  planoId: string;
  statusFilter?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export const useFuncionariosDoPlano = ({ 
  planoId, 
  statusFilter, 
  search, 
  pageIndex = 0,
  pageSize = 10 
}: UseFuncionariosDoPlanoParams) => {
  return useQuery({
    queryKey: ['funcionarios-do-plano', planoId, statusFilter, search, pageIndex, pageSize],
    queryFn: async () => {
      console.log('🔍 useFuncionariosDoPlano - Buscando funcionários do plano:', planoId);

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
        const statusValue = statusFilter as Database['public']['Enums']['status_matricula'];
        query = query.eq('status', statusValue);
      }

      // Aplicar filtro de busca
      if (search) {
        query = query.or(`funcionarios.nome.ilike.%${search}%,funcionarios.cpf.ilike.%${search}%,funcionarios.email.ilike.%${search}%`);
      }

      // Aplicar paginação
      const from = pageIndex * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query.order('funcionarios(nome)');

      if (error) {
        console.error('❌ useFuncionariosDoPlano - Erro ao buscar funcionários:', error);
        throw error;
      }

      const funcionarios: FuncionarioDoPlano[] = (data || []).map((matricula: any) => ({
        id: matricula.funcionarios.id,
        nome: matricula.funcionarios.nome,
        cpf: matricula.funcionarios.cpf,
        data_nascimento: matricula.funcionarios.data_nascimento,
        cargo: matricula.funcionarios.cargo,
        salario: matricula.funcionarios.salario,
        email: matricula.funcionarios.email,
        cnpj_id: matricula.funcionarios.cnpj_id,
        idade: matricula.funcionarios.idade,
        created_at: matricula.funcionarios.created_at,
        matricula_id: matricula.id,
        status_no_plano: matricula.status
      }));
      
      console.log('✅ useFuncionariosDoPlano - Funcionários encontrados:', funcionarios.length);
      
      return {
        funcionarios,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!planoId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
};
