import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface PlanoEmpresaPorTipo {
  id: string;
  seguradora: string;
  valor_mensal: number;
  valor_mensal_calculado?: number; // Novo campo para o valor calculado
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  tipo_seguro: string;
  total_funcionarios?: number;
}

export const useEmpresaPlanosPorTipo = (tipo: 'vida' | 'saude') => {
  const { empresaId } = useAuth();

  return useQuery({
    queryKey: ['planos-empresa-por-tipo', empresaId, tipo],
    queryFn: async (): Promise<PlanoEmpresaPorTipo[]> => {
      if (!empresaId) {
        logger.info('🔍 useEmpresaPlanosPorTipo - Empresa ID não encontrado');
        return [];
      }

      logger.info('🔍 useEmpresaPlanosPorTipo - Buscando planos tipo', tipo, 'para empresa:', empresaId);

      // Buscar planos do tipo específico para a empresa
      const { data: planos, error: planosError } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpjs!inner (
            id,
            cnpj,
            razao_social,
            empresa_id
          )
        `)
        .eq('cnpjs.empresa_id', empresaId)
        .eq('tipo_seguro', tipo);

      if (planosError) {
        logger.error('❌ useEmpresaPlanosPorTipo - Erro ao buscar planos:', planosError);
        throw planosError;
      }

      if (!planos || planos.length === 0) {
        logger.info('✅ useEmpresaPlanosPorTipo - Nenhum plano encontrado para tipo:', tipo);
        return [];
      }

      // Buscar contagem de funcionários ATIVOS VINCULADOS AO PLANO ESPECÍFICO
      const planosComFuncionarios = await Promise.all(
        planos.map(async (plano: any) => {
          const { data: funcionariosData, error: funcionariosError } = await supabase
            .from('planos_funcionarios')
            .select('id', { count: 'exact' })
            .eq('plano_id', plano.id)
            .eq('status', 'ativo'); // Apenas funcionários ativos NO PLANO

          if (funcionariosError) {
            logger.error('❌ Erro ao buscar funcionários do plano:', funcionariosError);
          }

          const totalFuncionariosNoPlano = funcionariosData?.length || 0;
          logger.info(`📊 Plano ${plano.seguradora} (${tipo}): ${totalFuncionariosNoPlano} funcionários vinculados`);

          // Para planos de saúde, vamos calcular um valor estimado baseado no número de funcionários NO PLANO
          let valorCalculado = plano.valor_mensal;
          if (tipo === 'saude') {
            // Estimativa simples: R$ 200 por funcionário ativo NO PLANO
            valorCalculado = totalFuncionariosNoPlano * 200;
            logger.info('🔍 Valor estimado para plano de saúde:', valorCalculado, 'funcionários no plano:', totalFuncionariosNoPlano);
          }

          return {
            id: plano.id,
            seguradora: plano.seguradora,
            valor_mensal: plano.valor_mensal,
            valor_mensal_calculado: valorCalculado,
            cobertura_morte: plano.cobertura_morte,
            cobertura_morte_acidental: plano.cobertura_morte_acidental,
            cobertura_invalidez_acidente: plano.cobertura_invalidez_acidente,
            cobertura_auxilio_funeral: plano.cobertura_auxilio_funeral,
            cnpj_id: plano.cnpj_id,
            cnpj_numero: plano.cnpjs.cnpj,
            cnpj_razao_social: plano.cnpjs.razao_social,
            tipo_seguro: plano.tipo_seguro,
            total_funcionarios: totalFuncionariosNoPlano,
          };
        })
      );

      logger.info('✅ useEmpresaPlanosPorTipo - Planos encontrados:', planosComFuncionarios.length, 'tipo:', tipo);
      return planosComFuncionarios;
    },
    enabled: !!empresaId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
