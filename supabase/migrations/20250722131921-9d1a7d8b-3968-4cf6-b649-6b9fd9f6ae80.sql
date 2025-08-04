
-- Função para criar um novo plano de seguro
CREATE OR REPLACE FUNCTION public.create_plano(
  p_cnpj_id uuid,
  p_seguradora text,
  p_valor_mensal numeric,
  p_cobertura_morte numeric,
  p_cobertura_morte_acidental numeric,
  p_cobertura_invalidez_acidente numeric,
  p_cobertura_auxilio_funeral numeric
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
    cobertura_invalidez_acidente,
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

-- Função para atualizar um plano existente
CREATE OR REPLACE FUNCTION public.update_plano(
  p_plano_id uuid,
  p_seguradora text,
  p_valor_mensal numeric,
  p_cobertura_morte numeric,
  p_cobertura_morte_acidental numeric,
  p_cobertura_invalidez_acidente numeric,
  p_cobertura_auxilio_funeral numeric
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
