
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TipoSeguro = Database['public']['Enums']['tipo_seguro'];

interface PlanoFuncionariosStats {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
  custoPorFuncionario: number;
}

interface UsePlanoFuncionariosStatsParams {
  planoId?: string; // NOVO: aceita planoId diretamente
  cnpjId?: string; // Torna opcional quando planoId é fornecido
  tipoSeguro?: TipoSeguro; // Torna opcional quando planoId é fornecido
  valorMensal: number;
}

export const usePlanoFuncionariosStats = (
  params: UsePlanoFuncionariosStatsParams | string, 
  tipoSeguro?: TipoSeguro, 
  valorMensal?: number
) => {
  // Suporte para ambas as assinaturas: nova (objeto) e antiga (parâmetros separados)
  const resolvedParams = typeof params === 'string' 
    ? { cnpjId: params, tipoSeguro: tipoSeguro!, valorMensal: valorMensal! }
    : params;

  const { planoId, cnpjId, tipoSeguro: resolvedTipoSeguro, valorMensal: resolvedValorMensal } = resolvedParams;

  return useQuery({
    queryKey: ['planoFuncionariosStats', planoId, cnpjId, resolvedTipoSeguro],
    queryFn: async (): Promise<PlanoFuncionariosStats> => {
      console.log('🔍 Buscando estatísticas com parâmetros:', { planoId, cnpjId, tipoSeguro: resolvedTipoSeguro });

      let resolvedPlanoId = planoId;

      // Se não temos planoId mas temos cnpjId e tipoSeguro, buscar o plano
      if (!resolvedPlanoId && cnpjId && resolvedTipoSeguro) {
        console.log('🔍 Buscando plano_id via cnpj_id e tipo_seguro...');
        const { data: planoData, error: planoError } = await supabase
          .from('dados_planos')
          .select('id')
          .eq('cnpj_id', cnpjId)
          .eq('tipo_seguro', resolvedTipoSeguro)
          .single();

        if (planoError) {
          console.error('❌ Erro ao buscar plano para stats:', planoError);
          throw planoError;
        }

        resolvedPlanoId = planoData.id;
        console.log('✅ Plano encontrado para stats:', resolvedPlanoId);
      }

      if (!resolvedPlanoId) {
        throw new Error('planoId, ou cnpjId + tipoSeguro devem ser fornecidos para buscar estatísticas');
      }

      // Buscar estatísticas das matrículas
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .select('status')
        .eq('plano_id', resolvedPlanoId);

      if (error) {
        console.error('❌ Erro ao buscar estatísticas de matrículas:', error);
        throw error;
      }

      const stats = data?.reduce((acc, matricula) => {
        acc.total++;
        switch (matricula.status) {
          case 'ativo':
            acc.ativos++;
            break;
          case 'pendente':
            acc.pendentes++;
            break;
          case 'inativo':
            acc.inativos++;
            break;
          case 'exclusao_solicitada':
            acc.pendentes++; // Consideramos exclusão solicitada como pendente
            break;
        }
        return acc;
      }, { total: 0, ativos: 0, pendentes: 0, inativos: 0 }) || { total: 0, ativos: 0, pendentes: 0, inativos: 0 };

      // Calcular custo por funcionário ativo
      const custoPorFuncionario = stats.ativos > 0 ? resolvedValorMensal / stats.ativos : 0;

      console.log('✅ Estatísticas calculadas:', { 
        ...stats, 
        custoPorFuncionario, 
        planoId: resolvedPlanoId,
        tipoSeguro: resolvedTipoSeguro 
      });

      return { ...stats, custoPorFuncionario };
    },
    enabled: !!(planoId || (cnpjId && resolvedTipoSeguro)),
  });
};
