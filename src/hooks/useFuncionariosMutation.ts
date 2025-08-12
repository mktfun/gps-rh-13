
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

      // 2. LÓGICA NOVA: Buscar a corretora_id a partir do cnpj_id
      const { data: cnpjData, error: cnpjError } = await supabase
        .from('cnpjs')
        .select(`
          id,
          empresas!inner(
            id,
            corretora_id
          )
        `)
        .eq('id', result.cnpj_id)
        .single();

      if (cnpjError || !cnpjData?.empresas?.corretora_id) {
        console.error("💥 CRÍTICO: Falha ao encontrar corretora para criar pendência:", cnpjError);
        toast.error("Funcionário criado, mas houve um erro ao registrar a pendência.");
        return result; // Retorna o funcionário, mas a pendência falhou.
      }

      const corretoraId = cnpjData.empresas.corretora_id;
      console.log('🏢 Corretora encontrada:', corretoraId);

      // 3. LÓGICA NOVA: Inserir o registro na tabela 'pendencias'
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 7); // Prazo de 7 dias
      const dataVencimento = vencimento.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      const pendenciaData = {
        protocolo: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tipo: 'ativacao',
        descricao: `Ativação pendente para o novo funcionário ${result.nome}.`,
        funcionario_id: result.id,
        cnpj_id: result.cnpj_id,
        corretora_id: corretoraId,
        status: 'pendente',
        data_vencimento: dataVencimento
      };

      console.log('📝 Criando pendência:', pendenciaData);

      const { error: pendenciaError } = await supabase
        .from('pendencias')
        .insert(pendenciaData);

      if (pendenciaError) {
        console.error("💥 CRÍTICO: Funcionário criado, mas falha ao criar pendência:", pendenciaError);
        toast.error("Funcionário criado, mas houve um erro ao registrar a pendência.");
      } else {
        console.log('✅ Pendência criada com sucesso!');
      }

      return result;
    },
    onSuccess: (data) => {
      console.log('🎉 Funcionário criado! Resetando paginação e invalidando cache...');
      
      // Resetar paginação para a primeira página
      if (resetPagination) {
        resetPagination();
      }

      // Invalidar todas as queries relacionadas aos funcionários deste CNPJ
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionarios', cnpjId] 
      });

      // Invalidar queries de estatísticas
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionariosStats', cnpjId] 
      });

      // Também invalidar as queries de detalhes do plano para atualizar contadores
      queryClient.invalidateQueries({ 
        queryKey: ['plano-detalhes', cnpjId] 
      });

      // NOVO: Invalidar queries de pendências para atualizar relatórios da corretora
      queryClient.invalidateQueries({ 
        queryKey: ['pendencias-corretora'] 
      });

      queryClient.invalidateQueries({ 
        queryKey: ['empresasComPlanos'] 
      });

      queryClient.invalidateQueries({ 
        queryKey: ['corretoraDashboardActions'] 
      });

      queryClient.invalidateQueries({ 
        queryKey: ['corretora-dashboard-actions-detailed'] 
      });

      queryClient.invalidateQueries({ 
        queryKey: ['corretoraDashboardMetrics'] 
      });

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
