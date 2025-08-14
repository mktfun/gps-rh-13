import { supabase } from '@/integrations/supabase/client';

/**
 * Versão simplificada para debug - cria pendências básicas para testar
 */
export const criarPendenciaSimplesDebug = async () => {
  try {
    console.log('🧪 TESTE: Criando pendência simples para debug...');

    // Verificar se temos acesso ao Supabase
    const { data: testData, error: testError } = await supabase
      .from('pendencias')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ Erro de acesso ao Supabase:', testError);
      return {
        success: false,
        created: 0,
        message: `Erro de acesso: ${testError.message}`,
        error: testError
      };
    }

    console.log('✅ Acesso ao Supabase funcionando');

    // Buscar um funcionário pendente simples
    const { data: funcionariosPendentes, error: errorFuncionarios } = await supabase
      .from('planos_funcionarios')
      .select('funcionario_id, plano_id')
      .eq('status', 'pendente')
      .limit(1);

    if (errorFuncionarios) {
      console.error('❌ Erro ao buscar funcionários pendentes:', errorFuncionarios);
      return {
        success: false,
        created: 0,
        message: `Erro: ${errorFuncionarios.message}`,
        error: errorFuncionarios
      };
    }

    if (!funcionariosPendentes || funcionariosPendentes.length === 0) {
      return {
        success: true,
        created: 0,
        message: 'Nenhum funcionário pendente encontrado para teste'
      };
    }

    const funcionario = funcionariosPendentes[0];
    console.log('🔍 Funcionário encontrado:', funcionario.funcionario_id);

    // Verificar se já existe pendência
    const { data: pendenciaExistente, error: errorVerify } = await supabase
      .from('pendencias')
      .select('id')
      .eq('funcionario_id', funcionario.funcionario_id)
      .eq('tipo', 'ativacao')
      .eq('status', 'pendente')
      .maybeSingle();

    if (errorVerify) {
      console.error('❌ Erro ao verificar pendência existente:', errorVerify);
      return {
        success: false,
        created: 0,
        message: `Erro na verificação: ${errorVerify.message}`,
        error: errorVerify
      };
    }

    if (pendenciaExistente) {
      return {
        success: true,
        created: 0,
        message: 'Funcionário já possui pendência ativa'
      };
    }

    // Buscar dados básicos do funcionário
    const { data: funcionarioData, error: errorFuncionario } = await supabase
      .from('funcionarios')
      .select('nome, cnpj_id')
      .eq('id', funcionario.funcionario_id)
      .single();

    if (errorFuncionario) {
      console.error('❌ Erro ao buscar funcionário:', errorFuncionario);
      return {
        success: false,
        created: 0,
        message: `Erro ao buscar funcionário: ${errorFuncionario.message}`,
        error: errorFuncionario
      };
    }

    // Buscar corretora_id do funcionário
    const { data: corretoraData, error: errorCorretora } = await supabase
      .from('cnpjs')
      .select(`
        empresas!inner (
          corretora_id
        )
      `)
      .eq('id', funcionarioData.cnpj_id)
      .single();

    if (errorCorretora) {
      console.error('❌ Erro ao buscar corretora:', errorCorretora);
      return {
        success: false,
        created: 0,
        message: `Erro ao buscar corretora: ${errorCorretora.message}`,
        error: errorCorretora
      };
    }

    const corretoraId = (corretoraData.empresas as any).corretora_id;
    if (!corretoraId) {
      return {
        success: false,
        created: 0,
        message: 'Não foi possível determinar a corretora'
      };
    }

    // Criar pendência simples
    const timestamp = Date.now();
    const protocolo = `TEST-${timestamp}`;
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 7);

    const novaPendencia = {
      protocolo,
      tipo: 'ativacao',
      descricao: `TESTE: Ativação pendente para ${funcionarioData.nome}`,
      funcionario_id: funcionario.funcionario_id,
      cnpj_id: funcionarioData.cnpj_id,
      corretora_id: corretoraId,
      status: 'pendente',
      data_vencimento: dataVencimento.toISOString().split('T')[0]
    };

    console.log('📝 Dados da pendência a ser criada:', novaPendencia);

    const { data: pendenciaCriada, error: errorInsert } = await supabase
      .from('pendencias')
      .insert([novaPendencia])
      .select('id, protocolo')
      .single();

    if (errorInsert) {
      console.error('❌ Erro ao inserir pendência:', errorInsert);
      return {
        success: false,
        created: 0,
        message: `Erro ao inserir: ${errorInsert.message}`,
        error: errorInsert
      };
    }

    console.log('✅ Pendência criada com sucesso:', pendenciaCriada);

    return {
      success: true,
      created: 1,
      message: `Pendência teste criada: ${pendenciaCriada.protocolo}`,
      pendencia: pendenciaCriada
    };

  } catch (error) {
    console.error('💥 Erro geral:', error);
    return {
      success: false,
      created: 0,
      message: `Erro geral: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
      error
    };
  }
};
