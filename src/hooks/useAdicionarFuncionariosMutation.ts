
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AdicionarFuncionariosData {
  planoId: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, funcionarioIds }: AdicionarFuncionariosData) => {
      logger.info('🔄 Adicionando funcionários ao plano:', { planoId, funcionarioIds });

      // Preparar dados para inserção em lote
      const planosFuncionarios = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status: 'pendente' as const
      }));

      const { data, error } = await supabase
        .from('planos_funcionarios')
        .insert(planosFuncionarios)
        .select();

      if (error) {
        logger.error('❌ Erro ao adicionar funcionários:', error);
        throw error;
      }

      logger.info('✅ Funcionários adicionados com sucesso:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      toast.success(`${variables.funcionarioIds.length} funcionário(s) adicionado(s) ao plano com sucesso!`);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['plano-funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano'] });
      queryClient.invalidateQueries({ queryKey: ['plano-funcionarios-stats'] });
      
      // Tentar debug das permissões se houver erro
      const debugPermissions = async () => {
        try {
          const { data: debugData } = await supabase.rpc('debug_pendencias_permissions' as any);
          logger.info('🔍 Debug permissions:', debugData);
        } catch (err) {
          logger.info('⚠️ Debug function not available:', err);
        }
      };
      
      debugPermissions();
    },
    onError: (error: any) => {
      logger.error('❌ Erro na mutação:', error);
      toast.error('Erro ao adicionar funcionários ao plano: ' + error.message);
    }
  });
};

export default useAdicionarFuncionariosMutation;
