
-- Atualizar a função create_plano_v2 para verificar duplicidade por cnpj_id + tipo_seguro
CREATE OR REPLACE FUNCTION public.create_plano_v2(
  p_cnpj_id uuid, 
  p_seguradora text, 
  p_valor_mensal numeric, 
  p_cobertura_morte numeric, 
  p_cobertura_morte_acidental numeric, 
  p_cobertura_invalidez_acidente numeric, 
  p_cobertura_auxilio_funeral numeric,
  p_tipo_seguro tipo_seguro DEFAULT 'vida'
)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

  -- Verificar se já existe um plano do mesmo tipo para este CNPJ
  IF EXISTS (
    SELECT 1 FROM dados_planos 
    WHERE cnpj_id = p_cnpj_id AND tipo_seguro = p_tipo_seguro
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe um plano do tipo ' || p_tipo_seguro || ' cadastrado para este CNPJ'
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
    cobertura_auxilio_funeral,
    tipo_seguro
  ) VALUES (
    p_cnpj_id,
    p_seguradora,
    p_valor_mensal,
    p_cobertura_morte,
    p_cobertura_morte_acidental,
    p_cobertura_invalidez_acidente,
    p_cobertura_auxilio_funeral,
    p_tipo_seguro
  )
  RETURNING id INTO v_plano_id;

  -- Buscar o plano criado com os dados da empresa
  SELECT 
    dp.id,
    dp.seguradora,
    dp.valor_mensal,
    dp.tipo_seguro,
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
      'tipo_seguro', v_new_plano.tipo_seguro,
      'empresa_nome', v_new_plano.empresa_nome,
      'cnpj_razao_social', v_new_plano.razao_social
    )
  );
END;
$function$;
