
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Empresa = Database['public']['Tables']['empresas']['Row'];

export const useEmpresa = (empresaId: string | undefined) => {
  return useQuery({
    queryKey: ['empresa', empresaId],
    queryFn: async () => {
      if (!empresaId) throw new Error('ID da empresa não fornecido');

      const { data, error } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Empresa não encontrada');

      return data;
    },
    enabled: !!empresaId,
  });
};
