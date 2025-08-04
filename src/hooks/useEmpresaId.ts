
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useEmpresaId = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresa-id', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (error || !profile?.empresa_id) {
        throw new Error('Empresa não encontrada para o usuário');
      }

      return profile.empresa_id;
    },
    enabled: !!user?.id,
  });
};
