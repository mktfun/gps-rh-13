import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoFuncionariosStats {
  total: number;
  ativos: number;
  pendentes: number;
  inativos: number;
  custoPorFuncionario: number;
  salarioMedio: number;
}

export const usePlanoFuncionariosStats = (planoId: string, tipoSeguro: string, valorMensal: number) => {
  return useQuery({
    queryKey: ['planoFuncionariosStats', tipoSeguro, planoId],
    queryFn: async (): Promise<PlanoFuncionariosStats> => {
      console.log('🔍 Buscando estatísticas via RPC SECURITY INVOKER para planoId:', planoId, 'tipo:', tipoSeguro);

      // Usar a nova função RPC com SECURITY INVOKER (aplica RLS corretamente)
      const { data, error } = await (supabase as any).rpc('get_plano_funcionarios_stats', {
        p_plano_id: planoId
      });

      if (error) {
        console.error('❌ Erro ao buscar estatísticas de matrículas:', error);
        console.error('❌ Código do erro:', error.code);
        console.error('❌ Mensagem:', error.message);
        console.error('❌ Detalhes:', error.details);

        const errorMessage = error.message || 'Erro ao buscar estatísticas de matrículas';
        throw new Error(`Erro ao buscar estatísticas: ${errorMessage}`);
      }

      if (!data) {
        console.warn('⚠️ Nenhuma estatística retornada');
        return { total: 0, ativos: 0, pendentes: 0, inativos: 0, custoPorFuncionario: 0, salarioMedio: 0 };
      }

      const stats = {
        total: data.total || 0,
        ativos: data.ativos || 0,
        pendentes: data.pendentes || 0,
        inativos: data.inativos || 0
      };

      // Calcular custo por funcionário ativo
      const custoPorFuncionario = stats.ativos > 0 ? valorMensal / stats.ativos : 0;

      // Buscar média de salários dos funcionários vinculados ao plano
      const { data: salarioData, error: salarioError } = await supabase
        .from('planos_funcionarios')
        .select(`
          funcionarios!inner(salario)
        `)
        .eq('plano_id', planoId);

      let salarioMedio = 0;
      if (!salarioError && salarioData && salarioData.length > 0) {
        const totalSalarios = salarioData.reduce((sum, item) => {
          return sum + (item.funcionarios?.salario || 0);
        }, 0);
        salarioMedio = salarioData.length > 0 ? totalSalarios / salarioData.length : 0;
      }

      console.log('✅ Estatísticas de matrículas via RPC:', { ...stats, custoPorFuncionario, salarioMedio });

      return { ...stats, custoPorFuncionario, salarioMedio };
    },
    enabled: !!planoId && !!tipoSeguro,
  });
};
