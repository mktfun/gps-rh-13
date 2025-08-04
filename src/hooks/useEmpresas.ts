
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EmpresaComMetricas {
  id: string;
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  corretora_id: string;
  created_at: string;
  updated_at: string;
  primeiro_acesso: boolean;
  total_funcionarios: number;
  total_pendencias: number;
  status_geral: string;
}

interface UseEmpresasParams {
  search?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useEmpresas = (params: UseEmpresasParams = {}) => {
  const { search, page = 1, pageSize = 10, orderBy = 'created_at', orderDirection = 'desc' } = params;
  const queryClient = useQueryClient();

  const {
    data: result,
    isLoading,
    error
  } = useQuery({
    queryKey: ['empresas-com-metricas', search, page, pageSize, orderBy, orderDirection],
    queryFn: async (): Promise<{ empresas: EmpresaComMetricas[]; totalCount: number; totalPages: number }> => {
      console.log('🏢 useEmpresas - Buscando empresas com métricas via RPC');
      
      try {
        // Usar RPC para buscar todas as empresas
        const { data, error } = await supabase.rpc('get_empresas_com_metricas');

        if (error) {
          console.error('❌ useEmpresas - Erro ao buscar empresas:', error);
          throw error;
        }

        // Filtrar registros nulos e validar estrutura de dados
        let empresas = (data || [])
          .filter((empresa: any) => {
            // Verificar se o objeto empresa não é null e tem propriedades essenciais
            if (!empresa || typeof empresa !== 'object') {
              console.warn('🚨 useEmpresas - Registro empresa inválido detectado:', empresa);
              return false;
            }

            // Verificar propriedades obrigatórias
            const hasRequiredFields = empresa.id && 
                                     empresa.nome && 
                                     empresa.responsavel && 
                                     empresa.email;
            
            if (!hasRequiredFields) {
              console.warn('🚨 useEmpresas - Empresa com campos obrigatórios ausentes:', empresa);
              return false;
            }

            return true;
          })
          .map((empresa: any): EmpresaComMetricas => ({
            id: empresa.id,
            nome: empresa.nome,
            responsavel: empresa.responsavel,
            email: empresa.email,
            telefone: empresa.telefone || '',
            corretora_id: empresa.corretora_id,
            created_at: empresa.created_at,
            updated_at: empresa.updated_at,
            primeiro_acesso: empresa.primeiro_acesso || false,
            total_funcionarios: empresa.total_funcionarios || 0,
            total_pendencias: empresa.total_pendencias || 0,
            status_geral: empresa.status_geral || 'Ativo'
          }));

        // Aplicar filtro de busca no lado cliente
        if (search && search.trim()) {
          const searchTerm = search.toLowerCase();
          empresas = empresas.filter(empresa => 
            empresa.nome.toLowerCase().includes(searchTerm) ||
            empresa.responsavel.toLowerCase().includes(searchTerm) ||
            empresa.email.toLowerCase().includes(searchTerm)
          );
        }

        // Aplicar ordenação no lado cliente
        empresas.sort((a, b) => {
          const aValue = a[orderBy as keyof EmpresaComMetricas];
          const bValue = b[orderBy as keyof EmpresaComMetricas];
          
          if (aValue < bValue) return orderDirection === 'asc' ? -1 : 1;
          if (aValue > bValue) return orderDirection === 'asc' ? 1 : -1;
          return 0;
        });

        // Calcular dados de paginação
        const totalCount = empresas.length;
        const totalPages = Math.ceil(totalCount / pageSize);
        
        // Aplicar paginação no lado cliente
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        const paginatedEmpresas = empresas.slice(from, to);

        console.log('✅ useEmpresas - Empresas válidas encontradas:', paginatedEmpresas.length, 'de', totalCount);
        
        return {
          empresas: paginatedEmpresas,
          totalCount,
          totalPages
        };
      } catch (error) {
        console.error('❌ useEmpresas - Erro na busca de empresas:', error);
        throw error;
      }
    },
    // Configurações de cache otimizadas para performance
    staleTime: 1000 * 60 * 5, // 5 minutos - dados considerados frescos
    gcTime: 1000 * 60 * 10, // 10 minutos - cache mantido na memória
    refetchOnWindowFocus: false, // Não revalidar ao focar na janela
  });

  // Mutações para CRUD
  const addEmpresa = useMutation({
    mutationFn: async (novaEmpresa: Omit<EmpresaComMetricas, 'id' | 'created_at' | 'updated_at' | 'total_funcionarios' | 'total_pendencias' | 'status_geral'>) => {
      const { data, error } = await supabase
        .from('empresas')
        .insert([novaEmpresa])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });
    }
  });

  const updateEmpresa = useMutation({
    mutationFn: async (empresa: Partial<EmpresaComMetricas> & { id: string }) => {
      const { id, total_funcionarios, total_pendencias, status_geral, ...updateData } = empresa;
      
      const { data, error } = await supabase
        .from('empresas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });
    }
  });

  const deleteEmpresa = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('empresas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });
    }
  });

  return {
    empresas: result?.empresas || [],
    totalCount: result?.totalCount || 0,
    totalPages: result?.totalPages || 0,
    isLoading,
    error,
    addEmpresa,
    updateEmpresa,
    deleteEmpresa
  };
};
