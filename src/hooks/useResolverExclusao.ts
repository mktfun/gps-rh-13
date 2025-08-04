
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResolverExclusaoParams {
  funcionarioId: string;
  acao: 'aprovar' | 'negar';
}

interface ResolverExclusaoResponse {
  success: boolean;
  message?: string;
  error?: string;
  funcionario?: {
    id: string;
    nome: string;
    empresa: string;
    novo_status: string;
  };
}

export const useResolverExclusao = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ funcionarioId, acao }: ResolverExclusaoParams) => {
      console.log(`🚀 Iniciando resolução de exclusão: ${acao} para funcionário ${funcionarioId}`);
      
      const { data, error } = await supabase.rpc('resolver_exclusao_funcionario', {
        p_funcionario_id: funcionarioId,
        p_aprovado: acao === 'aprovar'
      });

      if (error) {
        console.error('❌ Erro na RPC resolver_exclusao_funcionario:', error);
        throw error;
      }

      console.log('✅ RPC executada com sucesso:', data);
      return data as unknown as ResolverExclusaoResponse;
    },

    onSuccess: (data, variables) => {
      const { acao } = variables;
      
      console.log(`🎉 Solicitação de exclusão foi ${acao === 'aprovar' ? 'aprovada' : 'negada'} com sucesso!`);
      
      // AQUI ESTÁ A CORREÇÃO CRÍTICA, CARALHO! 
      // INVALIDAÇÃO COMPLETA DO CACHE PARA SINCRONIZAÇÃO IMEDIATA
      console.log('🔄 Invalidando todas as queries relevantes...');
      
      // 1. Dashboard metrics (gráfico de pizza e contadores)
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['empresaDashboard'] });
      
      // 2. Lista de funcionários (tabela)
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      
      // 3. Notificações (sino e lista)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      console.log('✅ Cache invalidado. UI deve atualizar instantaneamente.');

      toast({
        title: 'Sucesso',
        description: `Solicitação de exclusão foi ${acao === 'aprovar' ? 'aprovada' : 'negada'} com sucesso!`,
      });
    },

    onError: (error, variables) => {
      const { acao } = variables;
      
      console.error(`❌ Erro ao ${acao} exclusão:`, error);
      
      toast({
        title: 'Erro',
        description: `Erro ao processar a solicitação: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
