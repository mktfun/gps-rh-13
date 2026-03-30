
CREATE OR REPLACE FUNCTION fn_criar_pendencia_exclusao_pf()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cnpj_id uuid;
  v_func_nome text;
  v_corretora_id uuid;
  v_tipo_seguro text;
  v_tipo_plano_val text;
  v_protocolo text;
  v_already_exists boolean;
BEGIN
  SELECT f.cnpj_id, f.nome
  INTO v_cnpj_id, v_func_nome
  FROM funcionarios f
  WHERE f.id = NEW.funcionario_id;

  IF v_cnpj_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT e.corretora_id
  INTO v_corretora_id
  FROM cnpjs c
  JOIN empresas e ON e.id = c.empresa_id
  WHERE c.id = v_cnpj_id;

  IF v_corretora_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT dp.tipo_seguro::text
  INTO v_tipo_seguro
  FROM dados_planos dp
  WHERE dp.id = NEW.plano_id;

  IF v_tipo_seguro = 'saude' THEN
    v_tipo_plano_val := 'saude';
  ELSE
    v_tipo_plano_val := 'vida';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM pendencias
    WHERE funcionario_id = NEW.funcionario_id
      AND cnpj_id = v_cnpj_id
      AND tipo = 'cancelamento'
      AND tipo_plano = v_tipo_plano_val::tipo_plano
      AND status = 'pendente'
  ) INTO v_already_exists;

  IF v_already_exists THEN
    RETURN NEW;
  END IF;

  v_protocolo := 'PND-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);

  INSERT INTO pendencias (
    protocolo, tipo, status, descricao,
    funcionario_id, cnpj_id, corretora_id,
    data_criacao, data_vencimento, tipo_plano
  ) VALUES (
    v_protocolo,
    'cancelamento',
    'pendente',
    'Exclusão solicitada para ' || COALESCE(v_func_nome, 'funcionário'),
    NEW.funcionario_id,
    v_cnpj_id,
    v_corretora_id,
    now(),
    (CURRENT_DATE + interval '7 days')::date,
    v_tipo_plano_val::tipo_plano
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_pendencia_exclusao_pf ON planos_funcionarios;
CREATE TRIGGER trg_criar_pendencia_exclusao_pf
AFTER UPDATE OF status ON planos_funcionarios
FOR EACH ROW
WHEN (NEW.status = 'exclusao_solicitada' AND OLD.status IS DISTINCT FROM 'exclusao_solicitada')
EXECUTE FUNCTION fn_criar_pendencia_exclusao_pf();
