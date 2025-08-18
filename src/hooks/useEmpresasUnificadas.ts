import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface EmpresaUnificada {
  id: string;
  nome: string;
  planos_saude: number;
  planos_vida: number;
  total_planos: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
  total_funcionarios: number;
  pendencias_criticas: number;
  tem_pendencias: boolean;
  status: 'ativo' | 'configuracao_pendente' | 'com_pendencias';
}

export const useEmpresasUnificadas = (search?: string) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['empresas-unificadas', user?.id, search],
    queryFn: async (): Promise<EmpresaUnificada[]> => {
      if (!user?.id) {
        console.warn('⚠️ [useEmpresasUnificadas] Usuário não autenticado');
        return [];
      }

      console.log('🔍 [useEmpresasUnificadas] Buscando dados unificados das empresas');

      // Call RPC function to get unified empresa data
      const { data, error } = await supabase.rpc('get_empresas_unificadas', {
        p_corretora_id: user.id
      });

      if (error) {
        console.error('❌ [useEmpresasUnificadas] Erro ao buscar dados:', error);
        throw error;
      }

      if (!data) {
        console.log('⚠️ [useEmpresasUnificadas] Nenhum dado retornado');
        return [];
      }

      const empresas = (data as any[]).map((row): EmpresaUnificada => {
        const planos_saude = Number(row.planos_saude || 0);
        const planos_vida = Number(row.planos_vida || 0);
        const funcionarios_pendentes = Number(row.funcionarios_pendentes || 0);
        const pendencias_criticas = Number(row.pendencias_criticas || 0);
        const total_planos = planos_saude + planos_vida;

        // Determine status based on data
        let status: 'ativo' | 'configuracao_pendente' | 'com_pendencias' = 'ativo';
        
        if (funcionarios_pendentes > 0 || pendencias_criticas > 0) {
          status = 'com_pendencias';
        } else if (total_planos === 0) {
          status = 'configuracao_pendente';
        }

        return {
          id: String(row.id),
          nome: String(row.nome),
          planos_saude,
          planos_vida,
          total_planos,
          funcionarios_ativos: Number(row.funcionarios_ativos || 0),
          funcionarios_pendentes,
          total_funcionarios: Number(row.total_funcionarios || 0),
          pendencias_criticas,
          tem_pendencias: funcionarios_pendentes > 0 || pendencias_criticas > 0,
          status
        };
      });

      console.log(`✅ [useEmpresasUnificadas] ${empresas.length} empresas carregadas`);
      return empresas;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    // Client-side search filtering
    select: (empresas: EmpresaUnificada[]) => {
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        return empresas.filter(e => e.nome.toLowerCase().includes(searchLower));
      }
      return empresas;
    },
  });
};
