
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// A interface pode continuar a mesma
export interface FuncionarioForaDoPlano {
  id: string;
  nome: string;
  cpf: string;
  cargo: string;
  salario: number;
  idade: number;
  status: string;
}

export const useFuncionariosForaDoPlano = (planoId: string, cnpjId: string) => {
  return useQuery({
    queryKey: ['funcionarios-fora-do-plano', planoId, cnpjId],
    queryFn: async (): Promise<FuncionarioForaDoPlano[]> => {
      if (!planoId || !cnpjId) return [];

      console.log('🔍 Chamando RPC get_funcionarios_fora_do_plano:', { planoId, cnpjId });

      const { data, error } = await supabase.rpc('get_funcionarios_fora_do_plano' as any, {
        p_plano_id: planoId,
        p_cnpj_id: cnpjId
      });

      if (error) {
        console.error('❌ Erro ao executar RPC get_funcionarios_fora_do_plano:', error);
        throw error;
      }

      const funcionarios = data as FuncionarioForaDoPlano[];
      console.log('✅ RPC retornou funcionários elegíveis:', funcionarios?.length || 0);
      return funcionarios || [];
    },
    enabled: !!planoId && !!cnpjId,
  });
};
