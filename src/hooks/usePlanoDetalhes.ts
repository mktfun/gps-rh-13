import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
  valor_mensal_calculado?: number; // Novo campo para valor calculado
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  empresa_nome: string;
  tipo_seguro?: string;
}

export const usePlanoDetalhes = (planoId: string) => {
  return useQuery({
    queryKey: ['plano-detalhes', planoId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!planoId) {
        throw new Error('ID do plano não encontrado');
      }

      logger.info('🔍 Buscando detalhes do plano:', planoId);

      const { data, error } = await supabase.rpc('get_plano_detalhes', {
        p_plano_id: planoId,
      });

      if (error) {
        logger.error('❌ Erro ao buscar detalhes do plano:', error);
        throw error;
      }

      // Debugging detalhado
      logger.info('🔍 DEBUGGING - Resposta raw da função RPC:', {
        data,
        dataType: typeof data,
        isArray: Array.isArray(data),
        length: data?.length,
        firstItem: data?.[0]
      });

      // Validação mais robusta
      if (!data) {
        logger.warn('⚠️ Data é null/undefined:', data);
        throw new Error('Plano não encontrado');
      }

      if (!Array.isArray(data)) {
        logger.warn('⚠️ Data não é um array:', data);
        throw new Error('Formato de dados inválido');
      }

      if (data.length === 0) {
        logger.warn('⚠️ Array de dados está vazio para plano:', planoId);
        throw new Error('Plano não encontrado');
      }

      const planoData = data[0];
      
      // Validação do primeiro item do array
      if (!planoData || typeof planoData !== 'object') {
        logger.warn('⚠️ Primeiro item do array é inválido:', planoData);
        throw new Error('Dados do plano inválidos');
      }

      // Verificar se tem as propriedades essenciais
      if (!planoData.id || !planoData.seguradora) {
        logger.warn('⚠️ Dados do plano incompletos:', planoData);
        throw new Error('Dados do plano incompletos');
      }

      // Verificar o tipo de seguro para decidir se calcula valor dinâmico
      let valorCalculado = planoData.valor_mensal;
      
      // Buscar o tipo de seguro primeiro
      const { data: tipoData } = await supabase
        .from('dados_planos')
        .select('tipo_seguro')
        .eq('id', planoId)
        .single();
      
      const tipoSeguro = tipoData?.tipo_seguro || 'vida';
      
      // Se for plano de saúde, calcular valor real baseado nas faixas etárias cadastradas
      if (tipoSeguro === 'saude') {
        try {
          const { data: valorRpc, error: valorError } = await supabase
            .rpc('calcular_valor_mensal_plano_saude', { 
              p_plano_id: planoId 
            });

          if (valorError) {
            logger.error('❌ Erro ao calcular valor via RPC:', valorError);
          } else {
            valorCalculado = valorRpc || 0;
            logger.info('✅ Valor calculado para plano de saúde via RPC:', valorCalculado);
          }
        } catch (error) {
          logger.error('❌ Erro ao calcular valor do plano de saúde:', error);
        }
      }

      const resultado = {
        ...planoData,
        valor_mensal_calculado: valorCalculado,
        tipo_seguro: tipoSeguro
      };

      logger.info('✅ Detalhes do plano validados e encontrados:', resultado);
      return resultado;
    },
    enabled: !!planoId,
    // Adicionar configurações para evitar refetch desnecessário
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 10, // 10 minutos
  });
};
