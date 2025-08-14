import { supabase } from '@/integrations/supabase/client';

/**
 * Cria pendências para funcionários que estão com status 'pendente' em planos
 * mas não possuem pendências correspondentes na tabela pendencias
 */
export const criarPendenciasPendentesEmFalta = async () => {
  try {
    console.log('🔍 Buscando funcionários pendentes sem pendências...');
    console.log('🔗 Conectando ao Supabase...');

    // 1. Buscar todos os funcionários em planos com status 'pendente' - query simplificada
    const { data: funcionariosPendentes, error: errorFuncionarios } = await supabase
      .from('planos_funcionarios')
      .select('funcionario_id, plano_id, status')
      .eq('status', 'pendente');

    if (errorFuncionarios) {
      console.error('❌ Erro ao buscar funcionários pendentes:', errorFuncionarios);
      return {
        success: false,
        created: 0,
        message: `Erro ao buscar funcionários pendentes: ${errorFuncionarios.message}`,
        error: errorFuncionarios
      };
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

    // 3. Para cada funcionário sem pendência, buscar os dados necessários e criar a pendência
    const pendenciasParaCriar = [];

    for (const funcionario of funcionariosSemPendencia) {
      try {
        // Buscar dados do funcionário
        const { data: funcionarioData, error: errorFuncionarioData } = await supabase
          .from('funcionarios')
          .select('nome, cnpj_id')
          .eq('id', funcionario.funcionario_id)
          .single();

        if (errorFuncionarioData || !funcionarioData) {
          console.error('❌ Erro ao buscar dados do funcionário:', errorFuncionarioData);
          continue;
        }

        // Buscar dados do plano
        const { data: planoData, error: errorPlanoData } = await supabase
          .from('planos')
          .select('seguradora')
          .eq('id', funcionario.plano_id)
          .single();

        if (errorPlanoData || !planoData) {
          console.error('❌ Erro ao buscar dados do plano:', errorPlanoData);
          continue;
        }

        // Buscar corretora através do CNPJ
        const { data: cnpjData, error: errorCnpjData } = await supabase
          .from('cnpjs')
          .select(`
            empresa_id,
            empresas!inner (
              corretora_id
            )
          `)
          .eq('id', funcionarioData.cnpj_id)
          .single();

        if (errorCnpjData || !cnpjData) {
          console.error('❌ Erro ao buscar dados do CNPJ:', errorCnpjData);
          continue;
        }

        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const protocolo = `PLN-${timestamp}-${randomString}`;
        const dataVencimento = new Date();
        dataVencimento.setDate(dataVencimento.getDate() + 7); // +7 dias

        pendenciasParaCriar.push({
          protocolo,
          tipo: 'ativacao',
          descricao: `Ativação pendente para ${funcionarioData.nome} no plano ${planoData.seguradora}.`,
          funcionario_id: funcionario.funcionario_id,
          cnpj_id: funcionarioData.cnpj_id,
          corretora_id: (cnpjData.empresas as any).corretora_id,
          status: 'pendente',
          data_vencimento: dataVencimento.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('❌ Erro ao processar funcionário:', funcionario.funcionario_id, error);
        continue;
      }
    }

    if (pendenciasParaCriar.length === 0) {
      console.log('⚠️ Nenhuma pendência pôde ser criada devido a erros nos dados');
      return { success: false, created: 0, message: 'Nenhuma pendência pôde ser criada devido a erros nos dados' };
    }

    // 4. Inserir todas as pendências de uma vez
    console.log(`📝 Tentando criar ${pendenciasParaCriar.length} pendências...`);

    const { data: pendenciasCriadas, error: errorInserir } = await supabase
      .from('pendencias')
      .insert(pendenciasParaCriar)
      .select('id, protocolo');

    if (errorInserir) {
      console.error('❌ Erro ao criar pendências:', errorInserir);
      return {
        success: false,
        created: 0,
        message: `Erro ao inserir pendências: ${errorInserir.message}`,
        error: errorInserir
      };
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
