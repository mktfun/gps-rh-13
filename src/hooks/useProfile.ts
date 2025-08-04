
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Profile {
  id: string;
  nome: string;
  email: string;
  role: string;
  notificacoes_email?: boolean;
  notificacoes_sistema?: boolean;
}

export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, email, role, notificacoes_email, notificacoes_sistema')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!user?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Partial<Pick<Profile, 'nome' | 'notificacoes_email' | 'notificacoes_sistema'>>) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    isUpdating: updateProfile.isPending,
  };
};
