
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type UserRole = Database['public']['Enums']['user_role'];

export interface Corretora {
  id: string;
  nome: string;
  email: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
  empresas_count?: number;
  funcionarios_count?: number;
  ultimo_acesso?: string;
}

interface CreateCorretoraData {
  nome: string;
  email: string;
  password: string;
}

interface ToggleStatusResponse {
  success: boolean;
  message: string;
  error?: string;
}

export const useCorretoras = () => {
  const queryClient = useQueryClient();

  const {
    data: corretoras = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['corretoras'],
    queryFn: async (): Promise<Corretora[]> => {
      console.log('Buscando corretoras...');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          status,
          created_at,
          updated_at
        `)
        .eq('role', 'corretora' as any)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar corretoras:', error);
        throw error;
      }

      // Buscar estatísticas para cada corretora
      const corretoras = await Promise.all(
        (data || []).map(async (corretora) => {
          const { count: empresasCount } = await supabase
            .from('empresas')
            .select('*', { count: 'exact', head: true })
            .eq('corretora_id', corretora.id);

          const { count: funcionariosCount } = await supabase
            .from('funcionarios')
            .select(`
              *,
              cnpjs!inner(
                empresas!inner(*)
              )
            `, { count: 'exact', head: true })
            .eq('cnpjs.empresas.corretora_id', corretora.id);

          return {
            ...corretora,
            status: corretora.status as 'ativo' | 'inativo',
            empresas_count: empresasCount || 0,
            funcionarios_count: funcionariosCount || 0
          };
        })
      );

      return corretoras;
    },
  });

  const toggleStatus = useMutation({
    mutationFn: async (correctoraId: string) => {
      console.log('🔄 Alterando status da corretora:', correctoraId);
      
      const { data, error } = await supabase.rpc('toggle_corretora_status', {
        target_user_id: correctoraId
      });

      if (error) {
        console.error('❌ Erro ao alterar status:', error);
        throw error;
      }

      console.log('✅ Status alterado com sucesso:', data);
      return data as unknown as ToggleStatusResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['corretoras'] });
      
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao alterar status');
      }
    },
    onError: (error) => {
      console.error('❌ Erro na mutação:', error);
      toast.error('Erro ao alterar status da corretora');
    }
  });

  return {
    corretoras,
    isLoading,
    error,
    toggleStatus
  };
};

export const useCreateCorretora = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (corretoraData: CreateCorretoraData) => {
      console.log('Criando nova corretora:', corretoraData);

      // Generate a simple UUID using crypto
      const newId = crypto.randomUUID();

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: newId,
          nome: corretoraData.nome,
          email: corretoraData.email,
          role: 'corretora' as UserRole
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar corretora:', error);
        throw error;
      }

      console.log('Corretora criada com sucesso');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['corretoras'] });
      toast.success('Corretora criada com sucesso');
    },
    onError: (error) => {
      console.error('Erro ao criar corretora:', error);
      toast.error('Erro ao criar corretora');
    }
  });
};
