
-- Função RPC para corretoras criarem/encontrarem conversas com empresas
CREATE OR REPLACE FUNCTION find_or_create_conversation_corretora(p_empresa_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_corretora_id UUID;
  v_conversa_id UUID;
  v_conversa_data JSON;
  v_empresa_nome TEXT;
BEGIN
  -- Verificar se o usuário atual é uma corretora
  v_corretora_id := auth.uid();
  
  IF v_corretora_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se o usuário é realmente uma corretora
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_corretora_id AND role = 'corretora'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não é uma corretora'
    );
  END IF;

  -- Verificar se a empresa pertence à corretora
  IF NOT EXISTS (
    SELECT 1 FROM empresas 
    WHERE id = p_empresa_id AND corretora_id = v_corretora_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Empresa não pertence à sua carteira'
    );
  END IF;

  -- Buscar nome da empresa
  SELECT nome INTO v_empresa_nome 
  FROM empresas 
  WHERE id = p_empresa_id;

  -- Verificar se já existe conversa
  SELECT id INTO v_conversa_id
  FROM conversas
  WHERE corretora_id = v_corretora_id AND empresa_id = p_empresa_id;

  -- Se não existe, criar nova conversa
  IF v_conversa_id IS NULL THEN
    INSERT INTO conversas (corretora_id, empresa_id)
    VALUES (v_corretora_id, p_empresa_id)
    RETURNING id INTO v_conversa_id;
  END IF;

  -- Retornar dados da conversa
  RETURN json_build_object(
    'success', true,
    'conversa', json_build_object(
      'id', v_conversa_id,
      'empresa_id', p_empresa_id,
      'empresa_nome', v_empresa_nome,
      'created_at', (SELECT created_at FROM conversas WHERE id = v_conversa_id)
    )
  );
END;
$$;

-- Função RPC para empresas criarem/encontrarem conversas com suas corretoras
CREATE OR REPLACE FUNCTION find_or_create_conversation_empresa()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_empresa_id UUID;
  v_corretora_id UUID;
  v_conversa_id UUID;
  v_corretora_nome TEXT;
BEGIN
  -- Verificar se o usuário atual está autenticado
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Buscar empresa_id do usuário
  SELECT empresa_id INTO v_empresa_id
  FROM profiles
  WHERE id = v_user_id AND role = 'empresa';

  IF v_empresa_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não é uma empresa ou empresa_id não encontrado'
    );
  END IF;

  -- Buscar corretora da empresa
  SELECT corretora_id INTO v_corretora_id
  FROM empresas
  WHERE id = v_empresa_id;

  IF v_corretora_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Corretora não encontrada para esta empresa'
    );
  END IF;

  -- Buscar nome da corretora
  SELECT nome INTO v_corretora_nome
  FROM profiles
  WHERE id = v_corretora_id;

  -- Verificar se já existe conversa
  SELECT id INTO v_conversa_id
  FROM conversas
  WHERE corretora_id = v_corretora_id AND empresa_id = v_empresa_id;

  -- Se não existe, criar nova conversa
  IF v_conversa_id IS NULL THEN
    INSERT INTO conversas (corretora_id, empresa_id)
    VALUES (v_corretora_id, v_empresa_id)
    RETURNING id INTO v_conversa_id;
  END IF;

  -- Retornar dados da conversa
  RETURN json_build_object(
    'success', true,
    'conversa', json_build_object(
      'id', v_conversa_id,
      'corretora_id', v_corretora_id,
      'corretora_nome', v_corretora_nome,
      'created_at', (SELECT created_at FROM conversas WHERE id = v_conversa_id)
    )
  );
END;
$$;
