import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdicionarFuncionariosPayload {
  planoId: string;
  tipoSeguro: string;
  funcionarioIds: string[];
}

export const useAdicionarFuncionariosMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ planoId, tipoSeguro, funcionarioIds }: AdicionarFuncionariosPayload) => {
      if (!planoId || !funcionarioIds.length || !tipoSeguro) {
        throw new Error('Plano ID, tipo de seguro e funcionários são obrigatórios');
      }

      console.log('🔄 Adicionando funcionários ao plano:', { planoId, tipoSeguro, funcionarioIds });

      // Buscar o CNPJ do plano para criar pendências corretamente
      const { data: plano, error: planoError } = await supabase
        .from('dados_planos')
        .select(`
          id, 
          cnpj_id,
          cnpjs!inner(
            id,
            empresas!inner(
              id,
              corretora_id
            )
          )
        `)
        .eq('id', planoId)
        .single();

      if (planoError || !plano?.cnpjs?.empresas?.corretora_id) {
        console.error('❌ Não foi possível obter o CNPJ e corretora do plano para criar pendências', planoError);
        const errorMessage = planoError?.message || 'CNPJ do plano ou corretora não encontrado';
        throw new Error(errorMessage);
      }

      const cnpjId = plano.cnpj_id;
      const corretoraId = plano.cnpjs.empresas.corretora_id;

      console.log('📋 Dados obtidos:', { cnpjId, corretoraId });

      // Criar registros para inserção em massa
      const registros = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status: 'pendente' as const
      }));

      const { data: insertPF, error: errorPF } = await supabase
        .from('planos_funcionarios')
        .insert(registros)
        .select();

      if (errorPF) {
        console.error('Erro ao adicionar funcionários ao plano:', errorPF);
        const errorMessage = errorPF.message || 'Erro ao adicionar funcionários ao plano';
        throw new Error(`Erro ao adicionar funcionários: ${errorMessage}`);
      }

      // Helper para gerar protocolo único
      const mkProtocolo = (suffix: string) => `PEN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${suffix}`;

      // Criar pendências de ativação para cada funcionário
      const vencimento = new Date();
      vencimento.setDate(vencimento.getDate() + 7);
      const dataVencimento = vencimento.toISOString().split('T')[0]; // 'YYYY-MM-DD'

      const pendenciasToInsert = funcionarioIds.map((funcionarioId, idx) => ({
        protocolo: mkProtocolo(String(idx + 1)),
        tipo: 'ativacao',
        descricao: `Ativação pendente para funcionário ${funcionarioId}`,
        funcionario_id: funcionarioId,
        cnpj_id: cnpjId,
        corretora_id: corretoraId, // ✅ CORREÇÃO: Adicionando a corretora_id obrigatória
        status: 'pendente',
        data_vencimento: dataVencimento
      }));

      console.log('🧾 Inserindo pendências de ativação:', pendenciasToInsert.length);

      const { data: insertPendencias, error: errorPendencias } = await supabase
        .from('pendencias')
        .insert(pendenciasToInsert)
        .select();

      if (errorPendencias) {
        console.error('❌ Erro ao criar pendências de ativação:', errorPendencias);
        throw errorPendencias;
      }

      return { insertPF, insertPendencias };
    },
    onSuccess: (data, variables) => {
      console.log('✅ Funcionários adicionados e pendências criadas com sucesso:', {
        planoId: variables.planoId,
        tipo: variables.tipoSeguro,
        pendenciasCriadas: data.insertPendencias?.length || 0
      });
      
      // Invalidar queries específicas do plano e tipo
      queryClient.invalidateQueries({ 
        queryKey: ['funcionarios-fora-do-plano', variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionarios', variables.tipoSeguro, variables.planoId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['planoFuncionariosStats', variables.tipoSeguro, variables.planoId] 
      });

      // Também invalidar pendências (corretora)
      queryClient.invalidateQueries({
        queryKey: ['pendencias-corretora']
      });

      toast.success(`${data.insertPF?.length || 0} funcionário(s) adicionado(s) e ${data.insertPendencias?.length || 0} pendência(s) criada(s)!`);
    },
    onError: (error) => {
      console.error('Erro na mutation:', error);
      toast.error('Erro ao adicionar funcionários ao plano');
    }
  });
};
