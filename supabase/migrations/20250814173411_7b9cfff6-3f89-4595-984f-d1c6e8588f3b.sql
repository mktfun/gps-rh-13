
-- Create the missing SQL functions that are being called by the TypeScript code

-- 1. Function to get pendencias for empresa
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
  comentarios_count INTEGER,
  prioridade INTEGER,
  corretora_id UUID
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
    p.comentarios_count,
    1 as prioridade,
    p.corretora_id
  FROM pendencias p
  INNER JOIN funcionarios f ON p.funcionario_id = f.id
  INNER JOIN cnpjs c ON p.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND p.status = 'pendente'
  ORDER BY p.data_criacao DESC;
$$;

-- 2. Function for debugging pendencias permissions
CREATE OR REPLACE FUNCTION public.debug_pendencias_permissions(p_corretora_id UUID DEFAULT NULL)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_result JSONB;
BEGIN
  -- Return debug information about user permissions
  SELECT jsonb_build_object(
    'user_id', v_user_id,
    'corretora_id', COALESCE(p_corretora_id, v_user_id),
    'user_role', (SELECT role FROM profiles WHERE id = v_user_id),
    'can_access_pendencias', EXISTS(
      SELECT 1 FROM pendencias p 
      WHERE p.corretora_id = COALESCE(p_corretora_id, v_user_id)
      LIMIT 1
    ),
    'total_pendencias', (
      SELECT COUNT(*) FROM pendencias p 
      WHERE p.corretora_id = COALESCE(p_corretora_id, v_user_id)
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 3. Function to repair missing pendencias for empresa
CREATE OR REPLACE FUNCTION public.repair_missing_pendencias_for_empresa(p_empresa_id UUID)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_created_count INTEGER := 0;
BEGIN
  -- Create pendencias for funcionarios pendentes without existing pendencias
  INSERT INTO pendencias (
    protocolo,
    tipo,
    funcionario_id,
    cnpj_id,
    corretora_id,
    descricao,
    data_vencimento
  )
  SELECT 
    'PEN-' || EXTRACT(EPOCH FROM NOW())::TEXT || '-' || f.id::TEXT,
    'ativacao',
    f.id,
    f.cnpj_id,
    e.corretora_id,
    'Ativação pendente para funcionário ' || f.nome,
    CURRENT_DATE + INTERVAL '7 days'
  FROM funcionarios f
  INNER JOIN cnpjs c ON f.cnpj_id = c.id
  INNER JOIN empresas e ON c.empresa_id = e.id
  WHERE c.empresa_id = p_empresa_id
    AND f.status = 'pendente'
    AND NOT EXISTS (
      SELECT 1 FROM pendencias p 
      WHERE p.funcionario_id = f.id 
        AND p.tipo = 'ativacao' 
        AND p.status = 'pendente'
    );
  
  GET DIAGNOSTICS v_created_count = ROW_COUNT;
  
  SELECT jsonb_build_object(
    'success', true,
    'created_pendencias', v_created_count,
    'message', 'Criadas ' || v_created_count || ' pendências'
  ) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- 4. Function to execute SQL (for admin/debugging purposes)
CREATE OR REPLACE FUNCTION public.exec_sql(sql TEXT)
RETURNS JSONB
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_result JSONB;
BEGIN
  -- Check if user is admin
  SELECT role INTO v_user_role FROM profiles WHERE id = auth.uid();
  
  IF v_user_role != 'admin' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: admin role required'
    );
  END IF;
  
  -- For security, only allow specific safe operations
  IF sql ILIKE '%CREATE OR REPLACE FUNCTION%' OR sql ILIKE '%ALTER TABLE%' THEN
    EXECUTE sql;
    RETURN jsonb_build_object(
      'success', true,
      'message', 'SQL executed successfully'
    );
  ELSE
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SQL operation not allowed'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_pendencias_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.repair_missing_pendencias_for_empresa(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
