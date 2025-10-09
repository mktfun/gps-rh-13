import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
      // ✅ CORREÇÃO DEFINITIVA: Usar RPC que já filtra corretamente por tipo de plano
      if (!empresaId || !tipoSeguro) {
        console.warn('⚠️ empresaId ou tipoSeguro não fornecidos');
        return [];
      }

      console.log('🔍 Chamando RPC get_cnpjs_com_metricas_por_tipo:', {
        empresaId,
        tipoSeguro
      });

      const { data, error } = await (supabase as any).rpc('get_cnpjs_com_metricas_por_tipo', {
        p_empresa_id: empresaId,
        p_tipo_plano_filter: tipoSeguro,
      });

      if (error) {
        console.error('❌ Erro ao buscar CNPJs com métricas:', error);
        throw error;
      }

      // Backend já entrega tudo mastigado - apenas mapear para o formato esperado
      let cnpjsComPlanos: CnpjComPlano[] = (data || []).map((cnpj: any) => ({
        id: cnpj.id,
        cnpj: cnpj.cnpj,
        razao_social: cnpj.razao_social,
        status: cnpj.status,
        created_at: cnpj.created_at,
        empresa_id: cnpj.empresa_id,
        temPlano: cnpj.tem_plano,
        planoId: cnpj.plano_id,
        seguradora: cnpj.seguradora,
        valor_mensal: cnpj.valor_mensal,
        funcionariosAtivos: Number(cnpj.funcionarios_ativos) || 0,
        totalFuncionarios: Number(cnpj.total_funcionarios) || 0,
        totalPendencias: Number(cnpj.total_pendencias) || 0,
        funcionariosPendentes: Number(cnpj.funcionarios_pendentes) || 0,
        funcionariosExclusaoSolicitada: Number(cnpj.funcionarios_exclusao_solicitada) || 0,
      }));

      // Aplicar filtro de busca (client-side)
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        cnpjsComPlanos = cnpjsComPlanos.filter(c => 
          c.cnpj.toLowerCase().includes(searchLower) ||
          c.razao_social.toLowerCase().includes(searchLower)
        );
      }

      // Aplicar filtro de plano
      if (filtroPlano === 'com-plano') {
        cnpjsComPlanos = cnpjsComPlanos.filter(c => c.temPlano);
      } else if (filtroPlano === 'sem-plano') {
        cnpjsComPlanos = cnpjsComPlanos.filter(c => !c.temPlano);
      }

      console.log('✅ CNPJs retornados (via RPC):', cnpjsComPlanos.length, 'tipo:', tipoSeguro);
      return cnpjsComPlanos;
    },
    enabled: !!empresaId && !!tipoSeguro,
    staleTime: 1000 * 60 * 2, // 2 minutos
    gcTime: 1000 * 60 * 5, // 5 minutos
  });
}
