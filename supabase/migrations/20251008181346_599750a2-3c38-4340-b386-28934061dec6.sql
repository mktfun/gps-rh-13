-- Criar RPC para criar funcionário com seleção de planos
CREATE OR REPLACE FUNCTION public.criar_funcionario_com_planos(
  p_nome TEXT,
  p_cpf TEXT,
  p_data_nascimento DATE,
  p_cargo TEXT,
  p_salario NUMERIC,
  p_estado_civil estado_civil,
  p_email TEXT,
  p_cnpj_id UUID,
  p_incluir_saude BOOLEAN DEFAULT false,
  p_incluir_vida BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_funcionario_id UUID;
  v_corretora_id UUID;
  v_idade INTEGER;
  v_plano_saude_id UUID;
  v_plano_vida_id UUID;
  v_pendencias_criadas INTEGER := 0;
BEGIN
  SET search_path = 'public';
  
  -- Calcular idade
  v_idade := EXTRACT(YEAR FROM AGE(p_data_nascimento));
  
  -- Criar o funcionário
  INSERT INTO funcionarios (
    nome,
    cpf,
    data_nascimento,
    cargo,
    salario,
    estado_civil,
    email,
    cnpj_id,
    idade,
    status
  ) VALUES (
    p_nome,
    p_cpf,
    p_data_nascimento,
    p_cargo,
    p_salario,
    p_estado_civil,
    p_email,
    p_cnpj_id,
    v_idade,
    'pendente'
  )
  RETURNING id INTO v_funcionario_id;
  
  -- Buscar corretora_id
  SELECT e.corretora_id INTO v_corretora_id
  FROM cnpjs c
  JOIN empresas e ON c.empresa_id = e.id
  WHERE c.id = p_cnpj_id;
  
  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Corretora não encontrada para o CNPJ especificado';
  END IF;
  
  -- Se incluir no plano de saúde
  IF p_incluir_saude THEN
    -- Buscar plano de saúde ativo para este CNPJ
    SELECT id INTO v_plano_saude_id
    FROM dados_planos
    WHERE cnpj_id = p_cnpj_id
      AND tipo_seguro = 'saude'
    LIMIT 1;
    
    IF v_plano_saude_id IS NOT NULL THEN
      -- Criar pendência de ativação para saúde
      INSERT INTO pendencias (
        protocolo,
        tipo,
        descricao,
        funcionario_id,
        cnpj_id,
        corretora_id,
        status,
        data_vencimento
      ) VALUES (
        'ACT-SAUDE-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
        'ativacao',
        'Ativação do funcionário ' || p_nome || ' no plano de saúde',
        v_funcionario_id,
        p_cnpj_id,
        v_corretora_id,
        'pendente',
        CURRENT_DATE + INTERVAL '7 days'
      );
      
      v_pendencias_criadas := v_pendencias_criadas + 1;
    END IF;
  END IF;
  
  -- Se incluir no seguro de vida
  IF p_incluir_vida THEN
    -- Buscar plano de vida ativo para este CNPJ
    SELECT id INTO v_plano_vida_id
    FROM dados_planos
    WHERE cnpj_id = p_cnpj_id
      AND tipo_seguro = 'vida'
    LIMIT 1;
    
    IF v_plano_vida_id IS NOT NULL THEN
      -- Criar pendência de ativação para vida
      INSERT INTO pendencias (
        protocolo,
        tipo,
        descricao,
        funcionario_id,
        cnpj_id,
        corretora_id,
        status,
        data_vencimento
      ) VALUES (
        'ACT-VIDA-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
        'ativacao',
        'Ativação do funcionário ' || p_nome || ' no seguro de vida',
        v_funcionario_id,
        p_cnpj_id,
        v_corretora_id,
        'pendente',
        CURRENT_DATE + INTERVAL '7 days'
      );
      
      v_pendencias_criadas := v_pendencias_criadas + 1;
    END IF;
  END IF;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'funcionario_id', v_funcionario_id,
    'pendencias_criadas', v_pendencias_criadas,
    'message', 'Funcionário cadastrado com sucesso'
  );
END;
$$;