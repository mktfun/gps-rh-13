import { supabase } from '@/integrations/supabase/client';

/**
 * Cria pendências para funcionários que estão com status 'pendente' em planos
 * mas não possuem pendências correspondentes na tabela pendencias
 */
export const criarPendenciasPendentesEmFalta = async () => {
  try {
    console.log('🔍 Buscando funcionários pendentes sem pendências...');

    // 1. Buscar todos os funcionários em planos com status 'pendente'
    const { data: funcionariosPendentes, error: errorFuncionarios } = await supabase
      .from('planos_funcionarios')
      .select(`
        funcionario_id,
        plano_id,
        status,
        funcionarios!inner (
          id,
          nome,
          cnpj_id,
          cnpjs!inner (
            id,
            empresa_id,
            cnpj,
            razao_social,
            empresas!inner (
              id,
              corretora_id
            )
          )
        ),
        planos!inner (
          id,
          seguradora
        )
      `)
      .eq('status', 'pendente');

    if (errorFuncionarios) {
      console.error('❌ Erro ao buscar funcionários pendentes:', errorFuncionarios);
      throw errorFuncionarios;
    }

    if (!funcionariosPendentes || funcionariosPendentes.length === 0) {
      console.log('ℹ️ Nenhum funcionário pendente encontrado');
      return { success: true, created: 0, message: 'Nenhum funcionário pendente encontrado' };
    }

    console.log(`📋 Encontrados ${funcionariosPendentes.length} funcionários pendentes`);

    // 2. Para cada funcionário pendente, verificar se já existe pendência
    const funcionariosSemPendencia = [];

    for (const funcionario of funcionariosPendentes) {
      const { data: pendenciaExistente, error: errorPendencia } = await supabase
        .from('pendencias')
        .select('id')
        .eq('funcionario_id', funcionario.funcionario_id)
        .eq('tipo', 'ativacao')
        .eq('status', 'pendente')
        .maybeSingle();

      if (errorPendencia) {
        console.error('❌ Erro ao verificar pendência existente:', errorPendencia);
        continue;
      }

      if (!pendenciaExistente) {
        funcionariosSemPendencia.push(funcionario);
      }
    }

    if (funcionariosSemPendencia.length === 0) {
      console.log('✅ Todos os funcionários pendentes já possuem pendências');
      return { success: true, created: 0, message: 'Todas as pendências já existem' };
    }

    console.log(`🆕 ${funcionariosSemPendencia.length} funcionários precisam de pendências`);

    // 3. Criar pendências para funcionários que não possuem
    const pendenciasParaCriar = funcionariosSemPendencia.map((funcionario: any) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const protocolo = `PLN-${timestamp}-${randomString}`;
      const dataVencimento = new Date();
      dataVencimento.setDate(dataVencimento.getDate() + 7); // +7 dias

      const funcionarioData = funcionario.funcionarios;
      const cnpjData = funcionarioData.cnpjs;
      const empresaData = cnpjData.empresas;
      const planoData = funcionario.planos;

      return {
        protocolo,
        tipo: 'ativacao',
        descricao: `Ativação pendente para ${funcionarioData.nome} no plano ${planoData.seguradora}.`,
        funcionario_id: funcionario.funcionario_id,
        cnpj_id: funcionarioData.cnpj_id,
        corretora_id: empresaData.corretora_id,
        status: 'pendente',
        data_vencimento: dataVencimento.toISOString().split('T')[0],
        data_criacao: new Date().toISOString()
      };
    });

    // 4. Inserir todas as pendências de uma vez
    const { data: pendenciasCriadas, error: errorInserir } = await supabase
      .from('pendencias')
      .insert(pendenciasParaCriar)
      .select('id, protocolo');

    if (errorInserir) {
      console.error('❌ Erro ao criar pendências:', errorInserir);
      throw errorInserir;
    }

    console.log(`✅ ${pendenciasCriadas?.length || 0} pendências criadas com sucesso!`);

    return {
      success: true,
      created: pendenciasCriadas?.length || 0,
      message: `${pendenciasCriadas?.length || 0} pendências criadas com sucesso`,
      pendencias: pendenciasCriadas
    };

  } catch (error) {
    console.error('💥 Erro geral ao criar pendências:', error);
    return {
      success: false,
      created: 0,
      message: `Erro ao criar pendências: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      error
    };
  }
};
