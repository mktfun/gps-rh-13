import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { handleApiError } from '@/lib/errorHandler';
import { logger } from '@/lib/logger';

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
  const { user } = useAuth();

  const {
    data: result,
    isLoading,
    error
  } = useQuery({
    queryKey: ['empresas-com-metricas', search, page, pageSize, orderBy, orderDirection],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_empresas_com_metricas');
      if (error) throw error;

      let filtered = data || [];
      if (search) {
        const s = search.toLowerCase();
        filtered = filtered.filter(e => e.nome?.toLowerCase().includes(s) || e.email?.toLowerCase().includes(s) || e.responsavel?.toLowerCase().includes(s));
      }

      if (orderBy) {
        filtered.sort((a: any, b: any) => {
          const va = a[orderBy] ?? '';
          const vb = b[orderBy] ?? '';
          return orderDirection === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
        });
      }

      const totalCount = filtered.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const empresas = filtered.slice(start, start + pageSize);

      return { empresas, totalCount, totalPages };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
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
      toast.success('Empresa criada com sucesso');
    },
    onError: (error) => {
      logger.error('Erro ao criar empresa:', error);
      handleApiError(error, 'Ao criar empresa');
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
      toast.success('Empresa atualizada com sucesso');
    },
    onError: (error) => {
      logger.error('Erro ao atualizar empresa:', error);
      handleApiError(error, 'Ao atualizar empresa');
    }
  });

  const deleteEmpresa = useMutation({
    mutationFn: async (id: string) => {
      logger.info('🗑️ Iniciando exclusão da empresa:', id);
      
      // Usar a função delete_empresa_with_cleanup para garantir a limpeza completa
      const { data, error } = await supabase.rpc('delete_empresa_with_cleanup', {
        empresa_id_param: id
      });

      if (error) {
        logger.error('❌ Erro ao excluir empresa:', error);
        
        // Tratamento específico para erro de auditoria
        if (error.code === '23502' && error.message?.includes('audit_log')) {
          throw new Error('Erro interno no sistema de auditoria. Tente novamente em alguns instantes.');
        }
        
        throw error;
      }

      if (!data) {
        throw new Error('Empresa não encontrada ou não pôde ser excluída');
      }

      logger.info('✅ Empresa excluída com sucesso');
      return data;
    },
    onSuccess: () => {
      logger.info('🔄 Invalidando cache após exclusão bem-sucedida');
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });
      toast.success('Empresa excluída com sucesso');
    },
    onError: (error: any) => {
      logger.error('❌ Erro na exclusão da empresa:', error);
      
      const errorMessage = error.message || 'Erro ao excluir empresa';
      handleApiError(error, 'Ao processar empresa');
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
