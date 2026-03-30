
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EmpresaComPlano {
  id: string;
  nome: string;
  total_planos_ativos: number;
  total_pendencias: number;
}

interface UseEmpresasComPlanosParams {
  tipoSeguro: 'vida' | 'saude';
  search?: string;
}

export const useEmpresasComPlanos = ({ tipoSeguro, search }: UseEmpresasComPlanosParams) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresasComPlanos', tipoSeguro, user?.id],
    queryFn: async (): Promise<EmpresaComPlano[]> => {
      if (!user?.id) {
        console.warn('⚠️ [useEmpresasComPlanos] Usuário não autenticado - retornando lista vazia');
        return [];
      }

      console.log('🔍 [useEmpresasComPlanos] Chamando RPC get_empresas_com_planos_por_tipo:', {
        tipoSeguro,
        corretoraId: user.id
      });

      // Cast temporário para evitar erro de tipagem enquanto os tipos do Supabase não são regenerados
      const { data, error } = await (supabase as any).rpc('get_empresas_com_planos_por_tipo', {
        p_tipo_seguro: tipoSeguro,
        p_corretora_id: user.id,
      });

      if (error) {
        console.error('❌ [useEmpresasComPlanos] Erro ao executar RPC:', error);
        throw error;
      }

      const rows = (data ?? []) as Array<{ id: string | number; nome: string; total_planos_ativos: string | number | null; total_pendencias: string | number | null }>;

      const normalized = rows.map((row) => ({
        id: String(row.id),
        nome: String(row.nome),
        total_planos_ativos: Number(row.total_planos_ativos ?? 0) || 0,
        total_pendencias: Number(row.total_pendencias ?? 0) || 0,
      })) as EmpresaComPlano[];

      console.log('✅ [useEmpresasComPlanos] RPC retornou empresas:', normalized.length);
      return normalized;
    },
    enabled: !!user?.id && !!tipoSeguro,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
    // Filtro de busca no client-side para evitar roundtrips desnecessários
    select: (empresas: EmpresaComPlano[]) => {
      if (search && search.trim()) {
        const s = search.toLowerCase();
        return empresas.filter(e => e.nome.toLowerCase().includes(s));
      }
      return empresas;
    },
  });
};
