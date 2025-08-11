
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface PlanoEmpresa {
  id: string;
  cnpj_id: string;
  tipo_seguro: 'vida' | 'saude' | 'outros';
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  created_at: string;
  updated_at: string;
  total_funcionarios: number;
}

export const usePlanosDaEmpresa = (cnpjId: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['planos-da-empresa', cnpjId],
    queryFn: async (): Promise<PlanoEmpresa[]> => {
      if (!cnpjId || !user?.id) {
        console.log('🔍 usePlanosDaEmpresa - CNPJ ID ou usuário não encontrado');
        return [];
      }

      console.log('🔍 usePlanosDaEmpresa - Buscando planos para CNPJ:', cnpjId);

      const { data, error } = await supabase
        .from('dados_planos')
        .select(`
          *,
          total_funcionarios:planos_funcionarios(count)
        `)
        .eq('cnpj_id', cnpjId);

      if (error) {
        console.error('❌ usePlanosDaEmpresa - Erro ao buscar planos:', error);
        throw error;
      }

      const planosComContagem = (data || []).map((plano: any) => ({
        ...plano,
        total_funcionarios: plano.total_funcionarios?.[0]?.count || 0
      }));

      console.log('✅ usePlanosDaEmpresa - Planos encontrados:', planosComContagem.length);
      return planosComContagem;
    },
    enabled: !!cnpjId && !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
