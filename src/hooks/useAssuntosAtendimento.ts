
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AssuntoAtendimento {
  id: string;
  nome: string;
  mensagem_padrao: string;
  created_at: string;
}

export const useAssuntosAtendimento = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['assuntos-atendimento'],
    queryFn: async (): Promise<AssuntoAtendimento[]> => {
      console.log('🔍 Buscando assuntos de atendimento...');

      const { data: assuntos, error } = await supabase
        .from('assuntos_atendimento')
        .select('*')
        .order('nome');

      if (error) {
        console.error('❌ Erro ao buscar assuntos:', error);
        throw error;
      }

      console.log('✅ Assuntos encontrados:', assuntos?.length || 0);
      return assuntos || [];
    },
  });

  return {
    assuntos: data || [],
    isLoading,
    error
  };
};
