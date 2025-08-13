import { supabase } from '@/integrations/supabase/client';

export const createGetPendenciasEmpresaFunction = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('🔧 Tentando criar função get_pendencias_empresa...');

    const functionSQL = `
      CREATE OR REPLACE FUNCTION public.get_pendencias_empresa(p_empresa_id UUID)
      RETURNS TABLE (
        id UUID,
        protocolo TEXT,
        tipo TEXT,
        funcionario_nome TEXT,
        funcionario_cpf TEXT,
        cnpj TEXT,
        razao_social TEXT,
        descricao TEXT,
        data_criacao TIMESTAMPTZ,
        data_vencimento DATE,
        status TEXT,
        dias_em_aberto INTEGER,
        comentarios_count INTEGER
      )
      LANGUAGE SQL
      SECURITY DEFINER
      AS $$
        SELECT 
          p.id,
          p.protocolo,
          p.tipo,
          f.nome as funcionario_nome,
          f.cpf as funcionario_cpf,
          c.cnpj,
          c.razao_social,
          p.descricao,
          p.data_criacao,
          p.data_vencimento,
          p.status,
          EXTRACT(DAY FROM NOW() - p.data_criacao)::INTEGER as dias_em_aberto,
          p.comentarios_count
        FROM pendencias p
        INNER JOIN funcionarios f ON p.funcionario_id = f.id
        INNER JOIN cnpjs c ON p.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
          AND p.status = 'pendente'
        ORDER BY p.data_criacao DESC;
      $$;

      GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;
    `;

    // Try using exec_sql RPC first
    const { error: execError } = await supabase.rpc('exec_sql', {
      sql: functionSQL
    });

    if (!execError) {
      console.log('✅ Função criada com sucesso via exec_sql');
      return { success: true, message: 'Função criada com sucesso!' };
    }

    console.log('⚠️ exec_sql não funcionou, tentando abordagem alternativa...');

    // Alternative approach: Test if we can call the function and handle 404 gracefully
    const { data, error: testError } = await supabase.rpc('get_pendencias_empresa', {
      p_empresa_id: '00000000-0000-0000-0000-000000000000'
    });

    if (!testError) {
      console.log('✅ Função já existe e está funcionando');
      return { success: true, message: 'Função já existe e está funcionando!' };
    }

    // If we get here, the function doesn't exist and we couldn't create it automatically
    console.log('❌ Não foi possível criar a função automaticamente');
    return { 
      success: false, 
      message: 'Função precisa ser criada manualmente no painel do Supabase. SQL disponível no console.' 
    };

  } catch (error) {
    console.error('❌ Erro ao criar função:', error);
    return { 
      success: false, 
      message: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};

export const testGetPendenciasEmpresaFunction = async (empresaId: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    console.log('🧪 Testando função get_pendencias_empresa com empresa ID:', empresaId);
    
    const { data, error } = await supabase.rpc('get_pendencias_empresa', {
      p_empresa_id: empresaId
    });

    if (error) {
      if (error.message.includes('404') || error.message.includes('function')) {
        return { 
          success: false, 
          message: 'Função get_pendencias_empresa não existe no banco de dados' 
        };
      }
      return { 
        success: false, 
        message: `Erro ao executar função: ${error.message}` 
      };
    }

    console.log('✅ Função executada com sucesso, retornou', data?.length || 0, 'pendências');
    return { 
      success: true, 
      message: `Função funcionando! Encontradas ${data?.length || 0} pendências`,
      data 
    };

  } catch (error) {
    console.error('❌ Erro ao testar função:', error);
    return { 
      success: false, 
      message: `Erro no teste: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
    };
  }
};

// SQL que deve ser executado manualmente no Supabase SQL Editor se a criação automática falhar
export const GET_PENDENCIAS_EMPRESA_SQL = `
-- Create function to get pendencias from pendencias table for empresa context
CREATE OR REPLACE FUNCTION public.get_pendencias_empresa(p_empresa_id UUID)
RETURNS TABLE (
  id UUID,
  protocolo TEXT,
  tipo TEXT,
  funcionario_nome TEXT,
  funcionario_cpf TEXT,
  cnpj TEXT,
  razao_social TEXT,
  descricao TEXT,
  data_criacao TIMESTAMPTZ,
  data_vencimento DATE,
  status TEXT,
  dias_em_aberto INTEGER,
  comentarios_count INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.protocolo,
    p.tipo,
    f.nome as funcionario_nome,
    f.cpf as funcionario_cpf,
    c.cnpj,
    c.razao_social,
    p.descricao,
    p.data_criacao,
    p.data_vencimento,
    p.status,
    EXTRACT(DAY FROM NOW() - p.data_criacao)::INTEGER as dias_em_aberto,
    p.comentarios_count
  FROM pendencias p
  INNER JOIN funcionarios f ON p.funcionario_id = f.id
  INNER JOIN cnpjs c ON p.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND p.status = 'pendente'
  ORDER BY p.data_criacao DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_pendencias_empresa(UUID) IS 
'Returns all pending pendencias for a specific empresa from the pendencias table';
`;
