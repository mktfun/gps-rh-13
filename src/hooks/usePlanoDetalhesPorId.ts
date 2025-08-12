
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoDetalhes {
  id: string;
  cnpj_id: string;
  tipo_seguro: 'vida' | 'saude';
  seguradora: string;
  valor_mensal: number;
  cobertura_morte: number;
  cobertura_morte_acidental: number;
  cobertura_invalidez_acidente: number;
  cobertura_auxilio_funeral: number;
  created_at: string;
  updated_at: string;
  cnpj: {
    id: string;
    cnpj: string;
    razao_social: string;
    empresa_id: string;
  };
  // Estatísticas dos funcionários DO PLANO (não do CNPJ)
  total_funcionarios: number;
  funcionarios_ativos: number;
  funcionarios_pendentes: number;
}

export const usePlanoDetalhesPorId = (planoId: string) => {
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
            empresa_id
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

      const result = {
        ...plano,
        ...funcionariosStats
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
