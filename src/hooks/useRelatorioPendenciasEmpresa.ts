
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmpresaId } from '@/hooks/useEmpresaId';

// PROTOCOLO GAMBIARRA CONTROLADA: Interface para RPC customizada não presente nos tipos gerados
interface RelatorioPendenciaEmpresa {
  funcionario_nome: string;
  cpf: string;
  cargo: string;
  status: string;
  cnpj_razao_social: string;
  data_solicitacao: string;
  motivo: string;
}

export const useRelatorioPendenciasEmpresa = () => {
  const { data: empresaId } = useEmpresaId();

  return useQuery({
    queryKey: ['relatorio-pendencias-empresa', empresaId],
    queryFn: async () => {
      if (!empresaId) throw new Error('Empresa ID não encontrado');

      console.log('Buscando relatório de pendências da empresa:', { empresaId });

      // PROTOCOLO GAMBIARRA CONTROLADA: RPC customizada não presente nos tipos gerados
      const { data, error } = await (supabase as any).rpc('get_relatorio_pendencias_empresa', {
        p_empresa_id: empresaId
      });

      if (error) {
        console.error('Erro ao buscar relatório de pendências da empresa:', error);
        throw error;
      }

      console.log('✅ Relatório de pendências carregado:', data);
      return (data || []) as RelatorioPendenciaEmpresa[];
    },
    enabled: !!empresaId,
  });
};
