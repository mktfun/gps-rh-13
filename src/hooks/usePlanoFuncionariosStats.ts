
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoFuncionariosStats {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
  custoPorFuncionario: number;
}

export const usePlanoFuncionariosStats = (planoId: string, tipoSeguro: string, valorMensal: number) => {
  return useQuery({
    queryKey: ['planoFuncionariosStats', tipoSeguro, planoId],
    queryFn: async (): Promise<PlanoFuncionariosStats> => {
      console.log('🔍 Buscando estatísticas via planos_funcionarios para planoId:', planoId, 'tipo:', tipoSeguro);

      // Buscar estatísticas das matrículas usando planoId diretamente
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .select('status')
        .eq('plano_id', planoId);

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

      console.log('✅ Estatísticas de matrículas calculadas para plano:', planoId, 'tipo:', tipoSeguro, { ...stats, custoPorFuncionario });

      return { ...stats, custoPorFuncionario };
    },
    enabled: !!planoId && !!tipoSeguro,
  });
};
