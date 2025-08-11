
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoFuncionariosStats {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
  custoPorFuncionario: number;
}

export const usePlanoFuncionariosStats = (cnpjId: string, valorMensal: number) => {
  return useQuery({
    queryKey: ['planoFuncionariosStats', cnpjId],
    queryFn: async (): Promise<PlanoFuncionariosStats> => {
      console.log('🔍 Buscando estatísticas via planos_funcionarios para cnpjId:', cnpjId);

      // Primeiro, buscar o plano_id
      const { data: planoData, error: planoError } = await supabase
        .from('dados_planos')
        .select('id')
        .eq('cnpj_id', cnpjId)
        .eq('tipo_seguro', 'vida')
        .single();

      if (planoError) {
        console.error('❌ Erro ao buscar plano:', planoError);
        throw planoError;
      }

      // Buscar estatísticas das matrículas
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .select('status')
        .eq('plano_id', planoData.id);

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
      const custoPorFuncionario = stats.ativos > 0 ? valorMensal / stats.ativos : 0;

      console.log('✅ Estatísticas de matrículas calculadas:', { ...stats, custoPorFuncionario });

      return { ...stats, custoPorFuncionario };
    },
    enabled: !!cnpjId,
  });
};
