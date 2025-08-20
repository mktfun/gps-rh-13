-- Fix remaining function security issues - Batch 1 (Most Critical Functions)

-- Update all vulnerable functions with SET search_path = 'public'
CREATE OR REPLACE FUNCTION public.create_plano(p_cnpj_id uuid, p_seguradora text, p_valor_mensal numeric, p_cobertura_morte numeric, p_cobertura_morte_acidental numeric, p_cobertura_invalidez_acidente numeric, p_cobertura_auxilio_funeral numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_plano_id UUID;
  v_new_plano RECORD;
BEGIN
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
$$;

CREATE OR REPLACE FUNCTION public.update_plano(p_plano_id uuid, p_seguradora text, p_valor_mensal numeric, p_cobertura_morte numeric, p_cobertura_morte_acidental numeric, p_cobertura_invalidez_acidente numeric, p_cobertura_auxilio_funeral numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_updated_plano RECORD;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se o usuário é corretora e se o plano pertence a uma de suas empresas
  IF NOT EXISTS (
    SELECT 1 
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    JOIN empresas e ON c.empresa_id = e.id
    JOIN profiles p ON p.id = v_user_id
    WHERE dp.id = p_plano_id 
      AND e.corretora_id = v_user_id
      AND p.role = 'corretora'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Acesso negado: Plano não pertence à sua carteira ou usuário não é corretora'
    );
  END IF;

  -- Atualizar o plano
  UPDATE dados_planos SET
    seguradora = p_seguradora,
    valor_mensal = p_valor_mensal,
    cobertura_morte = p_cobertura_morte,
    cobertura_morte_acidental = p_cobertura_morte_acidental,
    cobertura_invalidez_acidente = p_cobertura_invalidez_acidente,
    cobertura_auxilio_funeral = p_cobertura_auxilio_funeral,
    updated_at = NOW()
  WHERE id = p_plano_id;

  -- Buscar o plano atualizado com os dados da empresa
  SELECT 
    dp.id,
    dp.seguradora,
    dp.valor_mensal,
    c.razao_social,
    e.nome as empresa_nome
  INTO v_updated_plano
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  WHERE dp.id = p_plano_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Plano atualizado com sucesso',
    'plano', json_build_object(
      'id', v_updated_plano.id,
      'seguradora', v_updated_plano.seguradora,
      'valor_mensal', v_updated_plano.valor_mensal,
      'empresa_nome', v_updated_plano.empresa_nome,
      'cnpj_razao_social', v_updated_plano.razao_social
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_empresa_with_cleanup(empresa_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    empresa_record RECORD;
    cnpj_record RECORD;
    profile_record RECORD;
BEGIN
    -- Buscar dados da empresa
    SELECT * INTO empresa_record FROM empresas WHERE id = empresa_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Buscar todos os perfis de usuários associados à empresa
    FOR profile_record IN 
        SELECT DISTINCT p.* 
        FROM profiles p
        WHERE p.role = 'empresa' 
        AND (p.empresa_id = empresa_id_param OR p.email IN (
            SELECT DISTINCT f.email 
            FROM funcionarios f
            JOIN cnpjs c ON f.cnpj_id = c.id
            WHERE c.empresa_id = empresa_id_param 
            AND f.email IS NOT NULL
        ))
    LOOP
        -- Excluir perfil (o usuário do Auth deve ser excluído via código JavaScript)
        DELETE FROM profiles WHERE id = profile_record.id;
    END LOOP;
    
    -- Excluir a empresa (isso vai excluir em cascata todos os CNPJs, funcionários, dados_planos, etc.)
    DELETE FROM empresas WHERE id = empresa_id_param;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_corretora_status(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_user_role TEXT;
  target_user_info RECORD;
  new_status TEXT;
BEGIN
  -- Verificar se o usuário atual é admin
  SELECT role INTO current_user_role 
  FROM profiles 
  WHERE id = auth.uid();
  
  IF current_user_role != 'admin' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Acesso negado: apenas administradores podem executar esta ação'
    );
  END IF;

  -- Buscar informações do usuário alvo
  SELECT * INTO target_user_info
  FROM profiles
  WHERE id = target_user_id AND role = 'corretora';
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Corretora não encontrada'
    );
  END IF;

  -- Determinar novo status
  IF target_user_info.status = 'ativo' THEN
    new_status := 'inativo';
  ELSE
    new_status := 'ativo';
  END IF;

  -- Atualizar status
  UPDATE profiles 
  SET status = new_status, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Status atualizado com sucesso',
    'corretora', json_build_object(
      'id', target_user_info.id,
      'nome', target_user_info.nome,
      'email', target_user_info.email,
      'status_anterior', target_user_info.status,
      'status_atual', new_status
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_plano(p_plano_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_plano_info RECORD;
BEGIN
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar informações do plano e verificar se o usuário tem permissão
  SELECT 
    dp.id,
    dp.seguradora,
    c.razao_social,
    e.nome as empresa_nome
  INTO v_plano_info
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  JOIN profiles p ON p.id = v_user_id
  WHERE dp.id = p_plano_id 
    AND e.corretora_id = v_user_id
    AND p.role = 'corretora';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Plano não encontrado ou acesso negado'
    );
  END IF;

  -- Excluir o plano
  DELETE FROM dados_planos WHERE id = p_plano_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Plano excluído com sucesso',
    'plano', json_build_object(
      'id', v_plano_info.id,
      'seguradora', v_plano_info.seguradora,
      'empresa_nome', v_plano_info.empresa_nome,
      'cnpj_razao_social', v_plano_info.razao_social
    )
  );
END;
$$;