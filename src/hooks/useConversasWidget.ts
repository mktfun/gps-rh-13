
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ConversaWidget {
  conversa_id: string;
  empresa_nome: string;
  created_at: string;
  protocolo?: string; // CAMPO NOVO AQUI
}

export const useConversasWidget = () => {
  const { user } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['conversas', user?.id],
    queryFn: async (): Promise<ConversaWidget[]> => {
      if (!user) {
        console.log('Usuário não autenticado.');
        return [];
      }

      console.log('🔍 Buscando conversas do usuário:', user.id);

      const { data: conversas, error } = await supabase.rpc('get_conversas_usuario');

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw error;
      }

      console.log('✅ Conversas encontradas:', conversas?.length || 0);
      
      // Mapear para o formato esperado, incluindo o protocolo
      return (conversas || []).map((conversa: any) => ({
        conversa_id: conversa.conversa_id,
        empresa_nome: conversa.empresa_nome,
        created_at: conversa.created_at,
        protocolo: conversa.protocolo || null // CAMPO NOVO AQUI - usando any para acessar protocolo
      }));
    },
    enabled: !!user,
  });

  return {
    conversas: data || [],
    isLoading,
    error
  };
};
