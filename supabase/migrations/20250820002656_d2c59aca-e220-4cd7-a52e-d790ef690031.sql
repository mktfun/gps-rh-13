-- Fix Critical Security Issues (Priority 1: ERROR Level)

-- 1. CRITICAL: Remove exposed auth users view completely
DROP VIEW IF EXISTS users_view CASCADE;

-- 2. CRITICAL: Fix security definer views issue
-- Drop and recreate the security_events view without security definer
DROP VIEW IF EXISTS security_events CASCADE;

-- Create a secure function instead of a view for security events
CREATE OR REPLACE FUNCTION get_security_events()
RETURNS TABLE(
  id UUID,
  action_type TEXT,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  details JSONB,
  user_name TEXT,
  user_role user_role
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only admins can access security events
  IF get_my_role() != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;

  RETURN QUERY
  SELECT 
    al.id,
    al.action_type,
    al.user_email,
    al.created_at,
    al.details,
    p.nome as user_name,
    p.role as user_role
  FROM audit_log al
  LEFT JOIN profiles p ON p.email = al.user_email
  WHERE al.action_type IN ('ROLE_CHANGE', 'SECURITY_VIOLATION', 'SUSPICIOUS_ACTIVITY')
  ORDER BY al.created_at DESC;
END;
$$;

-- 3. Fix all existing functions by adding search_path - batch update for most critical ones
CREATE OR REPLACE FUNCTION public.get_empresas_com_planos_por_tipo(p_tipo_seguro text, p_corretora_id uuid)
RETURNS TABLE(id uuid, nome text, total_planos_ativos bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT
    e.id,
    e.nome,
    COUNT(DISTINCT p.id) FILTER (WHERE p.tipo_seguro::text = p_tipo_seguro) AS total_planos_ativos
  FROM
    empresas e
  LEFT JOIN
    cnpjs c ON e.id = c.empresa_id
  LEFT JOIN
    dados_planos p ON c.id = p.cnpj_id
  WHERE
    e.corretora_id = p_corretora_id
  GROUP BY
    e.id, e.nome
  ORDER BY
    e.nome;
$$;

CREATE OR REPLACE FUNCTION public.get_planos_por_empresa(p_empresa_id uuid)
RETURNS TABLE(id uuid, seguradora text, valor_mensal numeric, cobertura_morte numeric, cobertura_morte_acidental numeric, cobertura_invalidez_acidente numeric, cobertura_auxilio_funeral numeric, cnpj_id uuid, cnpj_numero text, cnpj_razao_social text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
    SELECT
      dp.id,
      dp.seguradora,
      dp.valor_mensal,
      dp.cobertura_morte,
      dp.cobertura_morte_acidental,
      dp.cobertura_invalidez_acidente,
      dp.cobertura_auxilio_funeral,
      c.id as cnpj_id,
      c.cnpj as cnpj_numero,
      c.razao_social as cnpj_razao_social,
      e.nome as empresa_nome
    FROM
      dados_planos dp
    JOIN
      cnpjs c ON dp.cnpj_id = c.id
    JOIN
      empresas e ON c.empresa_id = e.id
    WHERE
      c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY c.razao_social, dp.seguradora;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_cnpj_with_cleanup(cnpj_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    cnpj_record RECORD;
    profile_record RECORD;
BEGIN
    -- Buscar dados do CNPJ
    SELECT * INTO cnpj_record FROM cnpjs WHERE id = cnpj_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar perfil associado ao CNPJ (se houver usuário específico para esta filial)
    SELECT * INTO profile_record 
    FROM profiles 
    WHERE email IN (
        SELECT DISTINCT email 
        FROM funcionarios 
        WHERE cnpj_id = cnpj_id_param 
        AND email IS NOT NULL
    ) 
    AND role = 'empresa'
    LIMIT 1;
    
    -- Excluir o CNPJ (isso vai excluir em cascata funcionários, dados_planos, etc.)
    DELETE FROM cnpjs WHERE id = cnpj_id_param;
    
    -- Se encontrou um perfil específico desta filial, excluir o usuário do Auth
    IF FOUND AND profile_record.id IS NOT NULL THEN
        -- Note: A exclusão do usuário do Auth deve ser feita via código JavaScript
        -- pois não temos acesso direto à tabela auth.users via SQL
        DELETE FROM profiles WHERE id = profile_record.id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- 4. Remove any remaining references to users_view in RLS policies
-- Update all policies that might reference the dropped view
DROP POLICY IF EXISTS "funcionarios_delete_unified" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_insert_unified" ON funcionarios;
DROP POLICY IF EXISTS "funcionarios_update_unified" ON funcionarios;

-- Recreate with direct profile references instead of users_view
CREATE POLICY "funcionarios_delete_unified" 
ON funcionarios FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role IN ('corretora', 'admin')
  )
);

CREATE POLICY "funcionarios_insert_unified" 
ON funcionarios FOR INSERT
TO authenticated
WITH CHECK (
  cnpj_id IN (
    SELECT c.id
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    JOIN profiles p ON p.id = auth.uid()
    WHERE (
      (p.role = 'corretora' AND e.corretora_id = p.id) OR
      (p.role = 'admin') OR
      (p.role = 'empresa' AND e.id = p.empresa_id)
    )
  )
);

CREATE POLICY "funcionarios_update_unified" 
ON funcionarios FOR UPDATE
TO authenticated
USING (
  cnpj_id IN (
    SELECT c.id
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    JOIN profiles p ON p.id = auth.uid()
    WHERE (
      (p.role = 'corretora' AND e.corretora_id = p.id) OR
      (p.role = 'admin') OR
      (p.role = 'empresa' AND e.id = p.empresa_id)
    )
  )
);