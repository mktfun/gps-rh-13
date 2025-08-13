import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type EstadoCivil = Database['public']['Enums']['estado_civil'];

interface CreateFuncionarioData {
  nome: string;
  cpf: string;
  data_nascimento: string;
  cargo: string;
  salario: number;
  estado_civil: EstadoCivil;
  email?: string;
  cnpj_id: string;
}

export const useFuncionariosMutation = (cnpjId: string, resetPagination?: () => void) => {
  const queryClient = useQueryClient();

  const createFuncionario = useMutation({
    mutationFn: async (data: CreateFuncionarioData) => {
      console.log('🔄 Criando funcionário:', data);

      // Calcular idade baseada na data de nascimento
      const idade = data.data_nascimento 
        ? new Date().getFullYear() - new Date(data.data_nascimento).getFullYear()
        : 0;

      const funcionarioData = {
        nome: data.nome,
        cpf: data.cpf,
        data_nascimento: data.data_nascimento,
        cargo: data.cargo,
        salario: data.salario,
        estado_civil: data.estado_civil,
        email: data.email,
        cnpj_id: cnpjId,
        idade,
        status: 'pendente' as const,
      };

      console.log('📋 Dados formatados para inserção:', funcionarioData);

      // 1. Criar o funcionário
      const { data: result, error } = await supabase
        .from('funcionarios')
        .insert(funcionarioData)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar funcionário:', error);
        throw error;
      }

      console.log('✅ Funcionário criado com sucesso:', result);
      console.log('ℹ️ Pendência de ativação será criada automaticamente pelo trigger do banco.');

      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Funcionário criado! Resetando paginação e invalidando cache...');
      
      // Resetar paginação para a primeira página
      if (resetPagination) {
        resetPagination();
      }

      // Invalidar todas as queries relacionadas aos funcionários deste CNPJ
      queryClient.invalidateQueries({ queryKey: ['planoFuncionarios', cnpjId] });

      // Invalidar queries de estatísticas
      queryClient.invalidateQueries({ queryKey: ['planoFuncionariosStats', cnpjId] });

      // Também invalidar as queries de detalhes do plano para atualizar contadores
      queryClient.invalidateQueries({ queryKey: ['plano-detalhes', cnpjId] });

      // Atualizações relevantes para pendências e dashboards
      queryClient.invalidateQueries({ queryKey: ['pendencias-corretora'] });
      queryClient.invalidateQueries({ queryKey: ['empresasComPlanos'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardActions'] });
      queryClient.invalidateQueries({ queryKey: ['corretora-dashboard-actions-detailed'] });
      queryClient.invalidateQueries({ queryKey: ['corretoraDashboardMetrics'] });
      // Opcional: se existir no app
      queryClient.invalidateQueries({ queryKey: ['empresas-com-metricas'] });

      toast.success(`Funcionário ${data.nome} adicionado com sucesso!`);
    },
    onError: (error: any) => {
      console.error('💥 Erro ao criar funcionário:', error);
      toast.error(error?.message || 'Erro ao adicionar funcionário');
    },
  });

  return {
    createFuncionario,
    isCreating: createFuncionario.isPending,
  };
};
