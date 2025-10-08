-- Função RPC para solicitar ativação de plano para funcionário existente
CREATE OR REPLACE FUNCTION public.solicitar_ativacao_plano_existente(
  p_funcionario_id UUID,
  p_tipo_plano TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cnpj_id UUID;
  v_corretora_id UUID;
  v_plano_id UUID;
  v_funcionario_nome TEXT;
  v_pendencia_existente UUID;
  v_vinculo_existente UUID;
BEGIN
  SET search_path = 'public';
  
  -- Buscar dados do funcionário
  SELECT f.cnpj_id, f.nome, e.corretora_id
  INTO v_cnpj_id, v_funcionario_nome, v_corretora_id
  FROM funcionarios f
  JOIN cnpjs c ON f.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  WHERE f.id = p_funcionario_id;
  
  IF v_cnpj_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Funcionário não encontrado'
    );
  END IF;
  
  -- Verificar se já existe vínculo ativo
  SELECT pf.id INTO v_vinculo_existente
  FROM planos_funcionarios pf
  JOIN dados_planos dp ON pf.plano_id = dp.id
  WHERE pf.funcionario_id = p_funcionario_id
    AND dp.tipo_seguro::TEXT = p_tipo_plano
    AND pf.status = 'ativo';
  
  IF v_vinculo_existente IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Funcionário já está ativo neste plano'
    );
  END IF;
  
  -- Verificar se já existe pendência de ativação
  SELECT id INTO v_pendencia_existente
  FROM pendencias
  WHERE funcionario_id = p_funcionario_id
    AND status = 'pendente'
    AND tipo = 'ativacao'
    AND descricao ILIKE '%' || CASE 
      WHEN p_tipo_plano = 'saude' THEN 'saúde'
      WHEN p_tipo_plano = 'vida' THEN 'vida'
      ELSE p_tipo_plano
    END || '%';
  
  IF v_pendencia_existente IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Já existe uma pendência de ativação para este plano'
    );
  END IF;
  
  -- Buscar o plano do tipo especificado para o CNPJ
  SELECT id INTO v_plano_id
  FROM dados_planos
  WHERE cnpj_id = v_cnpj_id
    AND tipo_seguro::TEXT = p_tipo_plano
  LIMIT 1;
  
  IF v_plano_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Nenhum plano do tipo ' || p_tipo_plano || ' encontrado para este CNPJ'
    );
  END IF;
  
  -- Criar a pendência de ativação
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
    'ACT-' || UPPER(p_tipo_plano) || '-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6),
    'ativacao',
    'Ativação do funcionário ' || v_funcionario_nome || ' no ' || CASE 
      WHEN p_tipo_plano = 'saude' THEN 'plano de saúde'
      WHEN p_tipo_plano = 'vida' THEN 'seguro de vida'
      ELSE 'plano'
    END,
    p_funcionario_id,
    v_cnpj_id,
    v_corretora_id,
    'pendente',
    CURRENT_DATE + INTERVAL '7 days'
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Pendência de ativação criada com sucesso'
  );
END;
$$;