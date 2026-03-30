import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface CnpjComPlano {
  id: string;
  cnpj: string;
  razao_social: string;
  status: string;
  created_at: string;
  empresa_id: string;
  temPlano: boolean;
  planoId?: string;
  seguradora?: string;
  valor_mensal?: number;
  funcionariosAtivos: number;
  totalFuncionarios: number;
  totalPendencias: number;
  funcionariosPendentes: number;
  funcionariosExclusaoSolicitada: number;
}

interface UseCnpjsComPlanosParams {
  empresaId?: string;
  search?: string;
  filtroPlano?: 'todos' | 'com-plano' | 'sem-plano';
  tipoSeguro?: 'vida' | 'saude';
}

// Overload para compatibilidade com chamadas antigas que passam apenas string
export function useCnpjsComPlanos(search: string): ReturnType<typeof useQuery<CnpjComPlano[]>>;
export function useCnpjsComPlanos(params: UseCnpjsComPlanosParams): ReturnType<typeof useQuery<CnpjComPlano[]>>;
export function useCnpjsComPlanos(paramsOrSearch: string | UseCnpjsComPlanosParams) {
  // Normalizar parâmetros
  const params: UseCnpjsComPlanosParams = typeof paramsOrSearch === 'string' 
    ? { search: paramsOrSearch }
    : paramsOrSearch;

  const { empresaId, search = '', filtroPlano = 'todos', tipoSeguro } = params;

  return useQuery({
    queryKey: ['cnpjs-com-planos', empresaId, search, filtroPlano, tipoSeguro],
    queryFn: async (): Promise<CnpjComPlano[]> => {
      if (!empresaId) {
        logger.warn('⚠️ empresaId não fornecido, retornando vazio');
        return [];
      }

      if (!tipoSeguro) {
        logger.warn('⚠️ tipoSeguro não fornecido, usando "vida" como padrão');
      }

      logger.info('🔍 Chamando RPC get_cnpjs_com_metricas_por_tipo para empresa:', empresaId, 'tipo:', tipoSeguro);

      // Chamar a RPC que já faz todo o trabalho pesado no backend
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_cnpjs_com_metricas_por_tipo', {
        p_empresa_id: empresaId,
        p_tipo_plano_filter: tipoSeguro || 'vida'
      });

      if (rpcError) {
        logger.error('❌ Erro ao buscar CNPJs com métricas:', rpcError);
        throw rpcError;
      }

      if (!rpcData || rpcData.length === 0) {
        logger.info('ℹ️ Nenhum CNPJ encontrado para esta empresa');
        return [];
      }

      logger.info(`✅ RPC retornou ${rpcData.length} CNPJs`);

      // Mapear o retorno da RPC para o formato esperado pelo frontend
      const cnpjsComPlanos: CnpjComPlano[] = rpcData.map((row: any) => ({
        id: row.id,
        cnpj: row.cnpj,
        razao_social: row.razao_social,
        status: row.status,
        created_at: row.created_at,
        empresa_id: row.empresa_id,
        temPlano: !!row.plano_id,
        planoId: row.plano_id,
        seguradora: row.plano_seguradora,
        valor_mensal: row.plano_valor_mensal,
        funcionariosAtivos: Number(row.ativos_no_plano) || 0,
        funcionariosPendentes: Number(row.pendentes_no_plano) || 0,
        funcionariosExclusaoSolicitada: Number(row.exclusao_solicitada_no_plano) || 0,
        totalPendencias: Number(row.pendentes_no_plano || 0) + Number(row.exclusao_solicitada_no_plano || 0),
        totalFuncionarios: Number(row.ativos_no_plano || 0) + Number(row.pendentes_no_plano || 0),
      }));

      // Aplicar filtros no frontend (search e filtroPlano)
      let resultado = cnpjsComPlanos;

      // Filtro de busca por texto
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        resultado = resultado.filter(c => 
          c.cnpj.toLowerCase().includes(searchLower) || 
          c.razao_social.toLowerCase().includes(searchLower)
        );
      }

      // Filtro de plano (com/sem plano)
      if (filtroPlano === 'com-plano') {
        resultado = resultado.filter(c => c.temPlano);
      } else if (filtroPlano === 'sem-plano') {
        resultado = resultado.filter(c => !c.temPlano);
      }

      logger.info(`✅ Retornando ${resultado.length} CNPJs após filtros (search: "${search}", filtroPlano: "${filtroPlano}")`);
      return resultado;
    },
    enabled: !!empresaId,
  });
}
