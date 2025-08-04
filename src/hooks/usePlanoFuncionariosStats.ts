
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanoFuncionariosStats {
  total: number;
  ativos: number;
  pendentes: number;
  desativados: number;
  custoTotal: number;
}

export const usePlanoFuncionariosStats = (cnpjId: string, valorMensal: number) => {
  return useQuery({
    queryKey: ['planoFuncionariosStats', cnpjId],
    queryFn: async (): Promise<PlanoFuncionariosStats> => {
      console.log('🔍 Buscando estatísticas dos funcionários para cnpjId:', cnpjId);

      const { data, error } = await supabase
        .from('funcionarios')
        .select('status')
        .eq('cnpj_id', cnpjId);

      if (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        throw error;
      }

      const stats = data?.reduce((acc, funcionario) => {
        acc.total++;
        switch (funcionario.status) {
          case 'ativo':
            acc.ativos++;
            break;
          case 'pendente':
            acc.pendentes++;
            break;
          case 'desativado':
            acc.desativados++;
            break;
        }
        return acc;
      }, { total: 0, ativos: 0, pendentes: 0, desativados: 0 }) || { total: 0, ativos: 0, pendentes: 0, desativados: 0 };

      const custoTotal = stats.ativos * valorMensal;

      console.log('✅ Estatísticas calculadas:', { ...stats, custoTotal });

      return { ...stats, custoTotal };
    },
    enabled: !!cnpjId,
  });
};
