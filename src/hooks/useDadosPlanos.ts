
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type DadoPlano = Database['public']['Tables']['dados_planos']['Row'];
type DadoPlanoInsert = Database['public']['Tables']['dados_planos']['Insert'];
type DadoPlanoUpdate = Database['public']['Tables']['dados_planos']['Update'];

interface UseDadosPlanosParams {
  cnpjId: string;
}

export const useDadosPlanos = ({ cnpjId }: UseDadosPlanosParams) => {
  const queryClient = useQueryClient();

  const { data: dadoPlano, isLoading, error } = useQuery({
    queryKey: ['dados-planos', cnpjId],
    queryFn: async (): Promise<DadoPlano | null> => {
      const { data, error } = await supabase
        .from('dados_planos')
        .select('*')
        .eq('cnpj_id', cnpjId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Erro ao buscar dados do plano:', error);
        throw error;
      }

      return data;
    },
    enabled: !!cnpjId,
  });

  const addDadoPlano = useMutation({
    mutationFn: async (dadoPlano: DadoPlanoInsert): Promise<DadoPlano> => {
      const { data, error } = await supabase
        .from('dados_planos')
        .insert(dadoPlano)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dados-planos', cnpjId] });
      toast.success('Dados do plano criados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar dados do plano:', error);
      toast.error('Erro ao criar dados do plano');
    },
  });

  const updateDadoPlano = useMutation({
    mutationFn: async ({ id, ...dadoPlano }: DadoPlanoUpdate & { id: string }): Promise<DadoPlano> => {
      const { data, error } = await supabase
        .from('dados_planos')
        .update(dadoPlano)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dados-planos', cnpjId] });
      toast.success('Dados do plano atualizados com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar dados do plano:', error);
      toast.error('Erro ao atualizar dados do plano');
    },
  });

  const deleteDadoPlano = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('dados_planos')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dados-planos', cnpjId] });
      toast.success('Dados do plano excluídos com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao excluir dados do plano:', error);
      toast.error('Erro ao excluir dados do plano');
    },
  });

  return {
    dadoPlano,
    isLoading,
    error,
    addDadoPlano,
    updateDadoPlano,
    deleteDadoPlano,
  };
};
