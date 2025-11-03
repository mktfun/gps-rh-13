import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BulkDeletionParams {
  funcionarioIds: string[];
}

interface DeletionResult {
  id: string;
  success: boolean;
  error?: string;
}

export const useBulkDeletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ funcionarioIds }: BulkDeletionParams) => {
      console.log(`🗑️ Iniciando exclusão em massa de ${funcionarioIds.length} funcionários`);

      // Processar em lotes de 10 para não sobrecarregar
      const batchSize = 10;
      const batches: string[][] = [];
      
      for (let i = 0; i < funcionarioIds.length; i += batchSize) {
        batches.push(funcionarioIds.slice(i, i + batchSize));
      }

      const allResults: DeletionResult[] = [];

      for (const batch of batches) {
        const batchPromises = batch.map(async (id) => {
          try {
            const { data, error } = await supabase.rpc('resolver_exclusao_funcionario', {
              p_funcionario_id: id,
              p_aprovado: true
            });

            if (error) throw error;

            return { id, success: true };
          } catch (error: any) {
            console.error(`❌ Erro ao excluir funcionário ${id}:`, error);
            return { id, success: false, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        allResults.push(...batchResults);

        // Pequeno delay entre batches para não sobrecarregar
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      const success = allResults.filter(r => r.success).map(r => r.id);
      const errors = allResults.filter(r => !r.success).map(r => ({ 
        id: r.id, 
        error: r.error || 'Erro desconhecido' 
      }));

      return { success, errors };
    },

    onSuccess: (results) => {
      console.log('✅ Exclusão em massa concluída:', results);

      // Invalidar TODAS as queries relevantes
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });

      if (results.success.length > 0) {
        toast.success(`${results.success.length} funcionário(s) excluído(s) com sucesso!`);
      }

      if (results.errors.length > 0) {
        toast.error(`${results.errors.length} funcionário(s) não puderam ser excluídos.`);
      }
    },

    onError: (error: any) => {
      console.error('❌ Erro crítico na exclusão em massa:', error);
      toast.error(`Erro ao processar exclusão: ${error.message}`);
    },
  });
};
