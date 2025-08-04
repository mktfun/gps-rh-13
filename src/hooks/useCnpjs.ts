
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

type Cnpj = Database['public']['Tables']['cnpjs']['Row'];
type CnpjInsert = Database['public']['Tables']['cnpjs']['Insert'];
type CnpjUpdate = Database['public']['Tables']['cnpjs']['Update'];

interface UseCnpjsParams {
  empresaId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export const useCnpjs = (params: UseCnpjsParams) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const {
    empresaId,
    page = 1,
    pageSize = 10,
    search = '',
    orderBy = 'created_at',
    orderDirection = 'desc'
  } = params || {};

  // Query para buscar CNPJs
  const {
    data: cnpjsData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['cnpjs', empresaId, page, pageSize, search, orderBy, orderDirection],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('cnpjs')
        .select('*', { count: 'exact' })
        .eq('empresa_id', empresaId)
        .range(from, to)
        .order(orderBy, { ascending: orderDirection === 'asc' });

      if (search) {
        query = query.or(`cnpj.ilike.%${search}%,razao_social.ilike.%${search}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        cnpjs: data || [],
        count: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    },
    enabled: !!empresaId
  });

  // Mutation para adicionar CNPJ
  const addCnpj = useMutation({
    mutationFn: async (cnpj: CnpjInsert) => {
      const { data, error } = await supabase
        .from('cnpjs')
        .insert(cnpj)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnpjs'] });
      toast({
        title: 'CNPJ criado',
        description: 'O CNPJ foi criado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar CNPJ',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para atualizar CNPJ
  const updateCnpj = useMutation({
    mutationFn: async ({ id, ...cnpj }: CnpjUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('cnpjs')
        .update(cnpj)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnpjs'] });
      toast({
        title: 'CNPJ atualizado',
        description: 'O CNPJ foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar CNPJ',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Mutation para deletar CNPJ
  const deleteCnpj = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('cnpjs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cnpjs'] });
      toast({
        title: 'CNPJ excluído',
        description: 'O CNPJ foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir CNPJ',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return {
    cnpjs: cnpjsData?.cnpjs || [],
    totalCount: cnpjsData?.count || 0,
    totalPages: cnpjsData?.totalPages || 0,
    isLoading,
    error,
    addCnpj,
    updateCnpj,
    deleteCnpj
  };
};
