import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

interface PendenciaEmpresa {
  id: string;
  protocolo: string;
  tipo: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  cnpj: string;
  razao_social: string;
  descricao: string;
  data_criacao: string;
  data_vencimento: string;
  status: string;
  dias_em_aberto: number;
  comentarios_count: number;
}

export const usePendenciasEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['pendencias-empresa', empresaId],
    queryFn: async (): Promise<PendenciaEmpresa[]> => {
      if (!empresaId) {
        throw new Error('Empresa ID não encontrado');
      }

      console.log('🔍 Buscando pendências da empresa:', empresaId);

      const { data, error } = await supabase.rpc('get_pendencias_empresa', {
        p_empresa_id: empresaId
      });

      if (error) {
        console.error('❌ Erro ao buscar pendências da empresa:', error);
        throw error;
      }

      console.log('✅ Pendências encontradas:', data?.length || 0);
      return data || [];
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 5, // 5 minutes
  });
};
