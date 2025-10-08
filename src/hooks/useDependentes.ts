import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Dependente {
  id: string;
  funcionario_id: string;
  nome: string;
  data_nascimento: string;
  parentesco: string;
  created_at: string;
}

export const useDependentes = (funcionarioId: string | null) => {
  const queryClient = useQueryClient();

  const { data: dependentes = [], isLoading } = useQuery({
    queryKey: ['dependentes', funcionarioId],
    queryFn: async () => {
      if (!funcionarioId) return [];

      const { data, error } = await supabase
        .from('dependentes')
        .select('*')
        .eq('funcionario_id', funcionarioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Dependente[];
    },
    enabled: !!funcionarioId,
  });

  const createDependente = useMutation({
    mutationFn: async (newDependente: Omit<Dependente, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('dependentes')
        .insert([newDependente])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependentes', funcionarioId] });
      toast.success('Dependente adicionado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao criar dependente:', error);
      toast.error('Erro ao adicionar dependente');
    },
  });

  const deleteDependente = useMutation({
    mutationFn: async (dependenteId: string) => {
      const { error } = await supabase
        .from('dependentes')
        .delete()
        .eq('id', dependenteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dependentes', funcionarioId] });
      toast.success('Dependente removido com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Erro ao deletar dependente:', error);
      toast.error('Erro ao remover dependente');
    },
  });

  return {
    dependentes,
    isLoading,
    createDependente,
    deleteDependente,
  };
};
