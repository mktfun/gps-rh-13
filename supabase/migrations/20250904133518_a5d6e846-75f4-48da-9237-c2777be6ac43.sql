-- CORREÇÃO DE SEGURANÇA: Adicionando SET search_path = 'public'; a todas as funções customizadas
-- Isso resolve a vulnerabilidade de segurança e garante que as funções encontrem as tabelas corretas

-- 1. get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SET search_path = 'public';
  SELECT role
  INTO v_role
  FROM profiles
  WHERE id = p_user_id;

  RETURN v_role;
END;
$function$;

-- 2. create_plano
CREATE OR REPLACE FUNCTION public.create_plano(p_cnpj_id uuid, p_seguradora text, p_valor_mensal numeric, p_cobertura_morte numeric, p_cobertura_morte_acidental numeric, p_cobertura_invalidez_acidente numeric, p_cobertura_auxilio_funeral numeric)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_plano_id UUID;
  v_new_plano RECORD;
BEGIN
  SET search_path = 'public';
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se o usuário é corretora e se o CNPJ pertence a uma de suas empresas
  IF NOT EXISTS (
    SELECT 1 
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    JOIN profiles p ON p.id = v_user_id
    WHERE c.id = p_cnpj_id 
      AND e.corretora_id = v_user_id
      AND p.role = 'corretora'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Acesso negado: CNPJ não pertence à sua carteira ou usuário não é corretora'
    );
  END IF;

  -- Verificar se já existe um plano para este CNPJ
  IF EXISTS (SELECT 1 FROM dados_planos WHERE cnpj_id = p_cnpj_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe um plano cadastrado para este CNPJ'
    );
  END IF;

  -- Inserir o novo plano
  INSERT INTO dados_planos (
    cnpj_id,
    seguradora,
    valor_mensal,
    cobertura_morte,
    cobertura_morte_acidental,
    cobertura_invalidez_acidade,
    cobertura_auxilio_funeral
  ) VALUES (
    p_cnpj_id,
    p_seguradora,
    p_valor_mensal,
    p_cobertura_morte,
    p_cobertura_morte_acidental,
    p_cobertura_invalidez_acidente,
    p_cobertura_auxilio_funeral
  )
  RETURNING id INTO v_plano_id;

  -- Buscar o plano criado com os dados da empresa
  SELECT 
    dp.id,
    dp.seguradora,
    dp.valor_mensal,
    c.razao_social,
    e.nome as empresa_nome
  INTO v_new_plano
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  WHERE dp.id = v_plano_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Plano criado com sucesso',
    'plano', json_build_object(
      'id', v_new_plano.id,
      'seguradora', v_new_plano.seguradora,
      'valor_mensal', v_new_plano.valor_mensal,
      'empresa_nome', v_new_plano.empresa_nome,
      'cnpj_razao_social', v_new_plano.razao_social
    )
  );
END;
$function$;

-- 3. contar_total_mensagens_nao_lidas
CREATE OR REPLACE FUNCTION public.contar_total_mensagens_nao_lidas()
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_total_nao_lidas INT;
BEGIN
    SET search_path = 'public';
    SELECT COUNT(*)::INT
    INTO v_total_nao_lidas
    FROM mensagens m
    WHERE m.lida_em IS NULL
    AND m.remetente_id != auth.uid()
    AND EXISTS (
        SELECT 1
        FROM conversas c
        JOIN empresas e ON c.empresa_id = e.id
        WHERE c.id = m.conversa_id
          AND (
            c.empresa_id = (SELECT p.empresa_id FROM profiles p WHERE p.id = auth.uid())
            OR
            e.corretora_id = auth.uid()
          )
    );
    RETURN v_total_nao_lidas;
END;
$function$;

-- 4. email_exists
CREATE OR REPLACE FUNCTION public.email_exists(email_to_check text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  RETURN EXISTS(
    SELECT 1
    FROM profiles
    WHERE email = email_to_check
  );
END;
$function$;

-- 5. get_funcionarios_ativos_count
CREATE OR REPLACE FUNCTION public.get_funcionarios_ativos_count(p_cnpj_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  count_result integer;
BEGIN
  SET search_path = 'public';
  SELECT COUNT(*)::integer INTO count_result
  FROM funcionarios f
  WHERE f.cnpj_id = p_cnpj_id 
    AND f.status = 'ativo';
  
  RETURN count_result;
END;
$function$;

-- 6. get_funcionarios_empresa_completo
CREATE OR REPLACE FUNCTION public.get_funcionarios_empresa_completo(p_empresa_id uuid, p_search_term text DEFAULT NULL::text, p_status_filter text DEFAULT 'all'::text, p_page_size integer DEFAULT 10, p_page_num integer DEFAULT 1)
 RETURNS TABLE(funcionario_id uuid, nome text, cpf text, cargo text, salario numeric, status text, idade integer, data_nascimento date, estado_civil text, email text, created_at timestamp with time zone, updated_at timestamp with time zone, cnpj_id uuid, cnpj_razao_social text, cnpj_numero text, plano_seguradora text, plano_valor_mensal numeric, plano_cobertura_morte numeric, total_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_total_count INTEGER;
    v_offset INTEGER;
BEGIN
    SET search_path = 'public';
    -- Calcular offset
    v_offset := (p_page_num - 1) * p_page_size;
    
    -- Primeiro, contar o total de registros (apenas funcionários únicos)
    SELECT COUNT(DISTINCT f.id) INTO v_total_count
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             f.nome ILIKE '%' || p_search_term || '%' OR 
             f.cpf ILIKE '%' || p_search_term || '%')
        AND (p_status_filter = 'all' OR f.status::TEXT = p_status_filter);
    
    -- Se não há registros, retornar vazio
    IF v_total_count = 0 THEN
        RETURN;
    END IF;
    
    -- Se o offset é maior que o total, ajustar para a última página válida
    IF v_offset >= v_total_count THEN
        v_offset := GREATEST(0, ((v_total_count - 1) / p_page_size) * p_page_size);
    END IF;
    
    -- Retornar dados paginados sem duplicatas
    RETURN QUERY
    SELECT DISTINCT ON (f.id)
        f.id as funcionario_id,
        f.nome,
        f.cpf,
        f.cargo,
        f.salario,
        f.status::TEXT,
        f.idade,
        f.data_nascimento,
        f.estado_civil::TEXT,
        f.email,
        f.created_at,
        f.updated_at,
        f.cnpj_id,
        c.razao_social as cnpj_razao_social,
        c.cnpj as cnpj_numero,
        dp.seguradora as plano_seguradora,
        dp.valor_mensal as plano_valor_mensal,
        dp.cobertura_morte as plano_cobertura_morte,
        v_total_count as total_count
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             f.nome ILIKE '%' || p_search_term || '%' OR 
             f.cpf ILIKE '%' || p_search_term || '%')
        AND (p_status_filter = 'all' OR f.status::TEXT = p_status_filter)
    ORDER BY f.id, c.razao_social, f.nome, dp.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$;

-- 7. get_empresa_planos_unificados
CREATE OR REPLACE FUNCTION public.get_empresa_planos_unificados(p_empresa_id uuid)
 RETURNS TABLE(plano_id uuid, cnpj_id uuid, seguradora text, valor_unitario numeric, cobertura_morte numeric, cobertura_morte_acidental numeric, cobertura_invalidez_acidente numeric, cobertura_auxilio_funeral numeric, cnpj_numero text, cnpj_razao_social text, funcionarios_ativos bigint, funcionarios_pendentes bigint, total_funcionarios bigint, custo_mensal_real numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
  SELECT
    dp.id as plano_id,
    dp.cnpj_id,
    dp.seguradora,
    dp.valor_mensal as valor_unitario,
    dp.cobertura_morte,
    dp.cobertura_morte_acidental,
    dp.cobertura_invalidez_acidente,
    dp.cobertura_auxilio_funeral,
    c.cnpj as cnpj_numero,
    c.razao_social as cnpj_razao_social,
    COUNT(f.id) FILTER (WHERE f.status = 'ativo') as funcionarios_ativos,
    COUNT(f.id) FILTER (WHERE f.status = 'pendente') as funcionarios_pendentes,
    COUNT(f.id) FILTER (WHERE f.status IN ('ativo', 'pendente')) as total_funcionarios,
    dp.valor_mensal as custo_mensal_real
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  LEFT JOIN funcionarios f ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
  GROUP BY dp.id, dp.cnpj_id, dp.seguradora, dp.valor_mensal, dp.cobertura_morte, 
           dp.cobertura_morte_acidental, dp.cobertura_invalidez_acidente, 
           dp.cobertura_auxilio_funeral, c.cnpj, c.razao_social
  ORDER BY c.razao_social;
END;
$function$;