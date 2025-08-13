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

      // Buscar perfil do usuário para debugging
      const { data: currentUser } = await supabase.auth.getUser();
      const { data: currentProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, empresa_id')
        .eq('id', currentUser.user?.id)
        .single();

      console.log('👤 Perfil do usuário atual:', currentProfile);
      console.log('🏢 Dados do plano e corretora:', { cnpjId, corretoraId, planoId });

      // Criar registros para inserção em massa
      const registros = funcionarioIds.map(funcionarioId => ({
        plano_id: planoId,
        funcionario_id: funcionarioId,
        status: 'pendente' as const
      }));

      console.log('📝 Inserindo registros em planos_funcionarios:', registros);

      // Verificar se os funcionários existem e são válidos
      const { data: funcionariosExistentes, error: errorValidacao } = await supabase
        .from('funcionarios')
        .select('id, status, cnpj_id')
        .in('id', funcionarioIds);

      if (errorValidacao) {
        console.error('❌ Erro ao validar funcionários:', errorValidacao);
        throw new Error(`Erro ao validar funcionários: ${errorValidacao.message}`);
      }

      if (!funcionariosExistentes || funcionariosExistentes.length !== funcionarioIds.length) {
        const encontrados = funcionariosExistentes?.map(f => f.id) || [];
        const naoEncontrados = funcionarioIds.filter(id => !encontrados.includes(id));
        console.error('❌ Funcionários não encontrados:', naoEncontrados);
        throw new Error(`Funcionários não encontrados: ${naoEncontrados.join(', ')}`);
      }

      console.log('✅ Funcionários validados:', funcionariosExistentes);

      const { data: insertPF, error: errorPF } = await supabase
        .from('planos_funcionarios')
        .insert(registros)
        .select();

      if (errorPF) {
        console.error('Erro ao adicionar funcionários ao plano:', errorPF);
        let errorMessage = errorPF.message || 'Erro ao adicionar funcionários ao plano';

        // Handle specific Supabase error codes
        if (errorPF.code === '23505') {
          errorMessage = 'Alguns funcionários já estão vinculados a este plano';
        } else if (errorPF.code === '42501') {
          errorMessage = 'Você não tem permissão para adicionar funcionários a este plano';
        } else if (errorPF.code === '23503') {
          errorMessage = 'Funcionário ou plano não encontrado';
        }

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
      console.log('🧾 Sample pendência data:', JSON.stringify(pendenciasToInsert[0], null, 2));
      console.log('🧾 Current user profile:', JSON.stringify(currentProfile, null, 2));

      // Debug: Usar função de debug RLS
      const { data: debugRLS, error: debugRLSError } = await supabase
        .rpc('debug_pendencias_permissions', { p_corretora_id: corretoraId });
      console.log('🧾 RLS Debug Result:', { debugRLS, debugRLSError });

      // Debug: Testar uma query simples na tabela pendencias
      const { data: testSelect, error: testError } = await supabase
        .from('pendencias')
        .select('id')
        .limit(1);
      console.log('🧾 Test SELECT on pendencias:', { data: testSelect, error: testError });

      const { data: insertPendencias, error: errorPendencias } = await supabase
        .from('pendencias')
        .insert(pendenciasToInsert)
        .select();

      if (errorPendencias) {
        console.error('❌ Erro ao criar pendências de ativação:', errorPendencias);
        console.error('❌ Dados da pendência que falhou:', pendenciasToInsert[0]);
        console.error('❌ Código do erro:', errorPendencias.code);
        console.error('❌ Mensagem completa:', errorPendencias.message);
        console.error('❌ Detalhes do erro:', errorPendencias.details);

        let errorMessage = errorPendencias.message || 'Erro ao criar pendências de ativação';

        // Handle specific Supabase error codes for pendencias
        if (errorPendencias.code === '23505') {
          errorMessage = 'Algumas pendências já existem para estes funcionários';
        } else if (errorPendencias.code === '42501') {
          errorMessage = `RLS Violation: Usuário ${currentProfile?.role} (ID: ${currentProfile?.id}) não pode criar pendência com corretora_id: ${corretoraId}. Verifique se você é uma corretora autorizada.`;
        } else if (errorPendencias.code === '23503') {
          errorMessage = 'Referência inválida ao criar pendência (funcionário, CNPJ ou corretora não encontrados)';
        }

        throw new Error(`Erro ao criar pendências: ${errorMessage}`);
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
    onError: (error: any) => {
      console.error('Erro na mutation:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao adicionar funcionários ao plano';
      toast.error(errorMessage);
    }
  });
};
