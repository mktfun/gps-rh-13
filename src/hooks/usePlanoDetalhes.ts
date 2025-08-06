
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoDetalhes {
  id: string;
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  cnpj_id: string;
  cnpj_numero: string;
  cnpj_razao_social: string;
  empresa_nome: string;
}

export const usePlanoDetalhes = (planoId: string | undefined) => {
  return useQuery({
    queryKey: ['plano-detalhes', planoId],
    queryFn: async (): Promise<PlanoDetalhes> => {
      if (!planoId) {
        console.error('❌ ID do plano não encontrado ou undefined');
        throw new Error('ID do plano não encontrado');
      }

      console.log('🔍 Buscando detalhes do plano:', planoId);

      const { data, error } = await supabase.rpc('get_plano_detalhes', {
        p_plano_id: planoId,
      });

      console.log('📊 Resposta da RPC:', { data, error });

      if (error) {
        console.error('❌ Erro ao buscar detalhes do plano:', error);
        throw new Error(`Erro na consulta: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ Plano não encontrado para ID:', planoId);
        throw new Error('Plano não encontrado');
      }

      const planoData = data[0];
      console.log('✅ Detalhes do plano encontrados:', planoData);

      // Garantir que os dados estão no formato correto
      const planoFormatado: PlanoDetalhes = {
        id: String(planoData.id),
        seguradora: String(planoData.seguradora || ''),
        valor_mensal: Number(planoData.valor_mensal || 0),
        cobertura_morte: Number(planoData.cobertura_morte || 0),
        cobertura_morte_acidental: Number(planoData.cobertura_morte_acidental || 0),
        cobertura_invalidez_acidente: Number(planoData.cobertura_invalidez_acidente || 0),
        cobertura_auxilio_funeral: Number(planoData.cobertura_auxilio_funeral || 0),
        cnpj_id: String(planoData.cnpj_id || ''),
        cnpj_numero: String(planoData.cnpj_numero || ''),
        cnpj_razao_social: String(planoData.cnpj_razao_social || ''),
        empresa_nome: String(planoData.empresa_nome || ''),
      };

      return planoFormatado;
    },
    enabled: !!planoId,
  });
};
