import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosPlanoParams {
  planoId: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosPlano = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, funcionarioIds }: AdicionarFuncionariosPlanoParams) => {
      console.log('🔄 [useAdicionarFuncionariosPlano] Ativando funcionários via RPC');

      const results: { funcionarioId: string; success: boolean; error?: string }[] = [];

      for (const funcionarioId of funcionarioIds) {
        const { data, error } = await supabase.rpc('ativar_funcionario_no_plano', {
          p_funcionario_id: funcionarioId,
          p_plano_id: planoId,
        });

        if (error) {
          console.error(`❌ Erro ao ativar ${funcionarioId}:`, error);
          results.push({ funcionarioId, success: false, error: error.message });
          continue;
        }

        const result = data as any;
        if (result && result.success === false) {
          console.error(`❌ RPC falhou para ${funcionarioId}:`, result.error);
          results.push({ funcionarioId, success: false, error: result.error });
        } else {
          results.push({ funcionarioId, success: true });
        }
      }

      const failures = results.filter(r => !r.success);
      if (failures.length === funcionarioIds.length) {
        throw new Error(`Falha ao ativar todos os funcionários: ${failures[0].error}`);
      }

      return { results, successCount: results.filter(r => r.success).length, failCount: failures.length };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-cnpj'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-saude'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-vida'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });

      if (data.failCount > 0) {
        toast.warning(`${data.successCount} ativado(s), ${data.failCount} com erro.`);
      } else {
        toast.success(`${data.successCount} funcionário(s) ativado(s) com sucesso!`);
      }
    },
    onError: (error) => {
      console.error('💥 [useAdicionarFuncionariosPlano] Erro:', error);
      toast.error('Erro ao ativar funcionários no plano');
    }
  });
};