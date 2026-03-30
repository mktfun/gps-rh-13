
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';
import { logger } from '@/lib/logger';

interface RelatorioCustoEmpresa {
  cnpj_razao_social: string;
  funcionario_nome: string;
  funcionario_cpf: string;
  valor_individual: number;
  status: string;
  total_cnpj: number;
}

export const useRelatorioCustosEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['relatorio-custos-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      logger.info('🔍 Buscando relatório de custos da empresa:', { empresaId });

      const { data, error } = await (supabase as any).rpc('get_relatorio_custos_empresa', {
        p_empresa_id: empresaId
      });

      if (error) {
        logger.error('❌ Erro ao buscar relatório de custos da empresa:', error);
        throw error;
      }

      logger.info('✅ Relatório de custos carregado:', data);
      return (data || []) as RelatorioCustoEmpresa[];
    },
    enabled: !!empresaId,
  });
};
