
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PlanoDetalhes } from '@/types/planos';

export const usePlanoDetalhes = (planoId: string) => {
  return useQuery({
    queryKey: ['plano-detalhes', planoId],
    queryFn: async (): Promise<PlanoDetalhes | null> => {
      if (!planoId) return null;

      console.log('🔍 Buscando detalhes do plano por ID:', planoId);

      // Buscar o plano básico
      const { data: plano, error: planoError } = await supabase
        .from('dados_planos')
        .select(`
          *,
          cnpj:cnpjs(
            id,
            cnpj,
            razao_social,
            empresa_id,
            empresas (
              nome
            )
          )
        `)
        .eq('id', planoId)
        .single();

      if (planoError) {
        console.error('❌ Erro ao buscar plano por ID:', planoError);
        throw planoError;
      }

      // Buscar estatísticas dos funcionários DO PLANO (planos_funcionarios)
      const { data: stats, error: statsError } = await supabase
        .from('planos_funcionarios')
        .select('status')
        .eq('plano_id', plano.id);

      if (statsError) {
        console.error('❌ Erro ao buscar estatísticas do plano:', statsError);
        throw statsError;
      }

      // Calcular estatísticas baseadas apenas nos funcionários vinculados ao plano
      const funcionariosStats = (stats || []).reduce((acc, matricula) => {
        acc.total_funcionarios++;
        switch (matricula.status) {
          case 'ativo':
            acc.funcionarios_ativos++;
            break;
          case 'pendente':
            acc.funcionarios_pendentes++;
            break;
        }
        return acc;
      }, { 
        total_funcionarios: 0, 
        funcionarios_ativos: 0, 
        funcionarios_pendentes: 0 
      });

      const result: PlanoDetalhes = {
        ...plano,
        ...funcionariosStats,
        // Campos derivados para compatibilidade
        empresa_nome: plano.cnpj?.empresas?.nome,
        cnpj_numero: plano.cnpj?.cnpj,
        cnpj_razao_social: plano.cnpj?.razao_social,
      };

      console.log('✅ Detalhes do plano carregados por ID:', {
        planoId: result.id,
        tipoSeguro: result.tipo_seguro,
        funcionarios: funcionariosStats
      });

      return result;
    },
    enabled: !!planoId,
  });
};
