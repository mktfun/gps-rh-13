import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AdicionarFuncionariosPlanoParams {
  planoId: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosPlano = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, funcionarioIds }: AdicionarFuncionariosPlanoParams) => {
      logger.info('🔄 [useAdicionarFuncionariosPlano] Iniciando adição de funcionários');
      logger.info('📝 [useAdicionarFuncionariosPlano] Parâmetros:', { planoId, funcionarioIds });

      // Preparar dados para inserção na tabela planos_funcionarios
      const registrosParaInserir = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status: 'ativo' as const
      }));

      logger.info('📊 [useAdicionarFuncionariosPlano] Dados para inserir:', registrosParaInserir);

      // Inserir registros na tabela planos_funcionarios
      const { data, error } = await supabase
        .from('planos_funcionarios')
        .insert(registrosParaInserir)
        .select();

      if (error) {
        logger.error('❌ [useAdicionarFuncionariosPlano] Erro:', error);
        throw new Error(`Erro ao adicionar funcionários ao plano: ${error.message}`);
      }

      logger.info('✅ [useAdicionarFuncionariosPlano] Funcionários adicionados com sucesso:', data);

      // Ativar os funcionários que estavam pendentes
      const { error: updateError } = await supabase
        .from('funcionarios')
        .update({ 
          status: 'ativo',
          updated_at: new Date().toISOString()
        })
        .in('id', funcionarioIds)
        .eq('status', 'pendente');

      if (updateError) {
        logger.error('⚠️ [useAdicionarFuncionariosPlano] Erro ao ativar funcionários:', updateError);
        // Não vamos falhar a operação por causa disso, apenas log
      } else {
        logger.info('✅ [useAdicionarFuncionariosPlano] Status dos funcionários atualizado para ativo');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      logger.info('🎉 [useAdicionarFuncionariosPlano] Sucesso - invalidando queries');
      logger.info('🔄 [useAdicionarFuncionariosPlano] Invalidando queries para planoId:', variables.planoId);
      
      // Invalidar todas as variações da query de funcionários do plano
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios'] });
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-disponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-fora-do-plano'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-cnpj'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-saude'] });
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes-cnpj-vida'] });
      
      // Invalidar queries da empresa para atualizar visão geral dos funcionários
      queryClient.invalidateQueries({ queryKey: ['funcionarios'] });
      queryClient.invalidateQueries({ queryKey: ['funcionarios-empresa-completo'] });
      
      toast.success(`${variables.funcionarioIds.length} funcionário(s) adicionado(s) ao plano com sucesso!`);
    },
    onError: (error) => {
      logger.error('💥 [useAdicionarFuncionariosPlano] Erro na mutação:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};