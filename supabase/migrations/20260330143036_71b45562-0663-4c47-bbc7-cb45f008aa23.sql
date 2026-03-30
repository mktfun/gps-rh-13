
-- Trigger function: create pendencia when employee status changes to exclusao_solicitada
CREATE OR REPLACE FUNCTION public.fn_criar_pendencia_exclusao()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_corretora_id uuid;
  v_protocolo text;
  v_plano record;
  v_tipo_plano_val tipo_plano;
BEGIN
  -- Only fire when status changes TO exclusao_solicitada
  IF NEW.status = 'exclusao_solicitada' AND (OLD.status IS DISTINCT FROM 'exclusao_solicitada') THEN
    -- Get corretora_id
    SELECT e.corretora_id INTO v_corretora_id
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    WHERE c.id = NEW.cnpj_id;

    IF v_corretora_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Create one pendencia per linked plan
    FOR v_plano IN
      SELECT pf.plano_id, dp.tipo_seguro
      FROM planos_funcionarios pf
      JOIN dados_planos dp ON dp.id = pf.plano_id
      WHERE pf.funcionario_id = NEW.id
        AND pf.status IN ('ativo', 'exclusao_solicitada')
    LOOP
      -- Map tipo_seguro to tipo_plano
      IF v_plano.tipo_seguro = 'vida' THEN
        v_tipo_plano_val := 'vida';
      ELSIF v_plano.tipo_seguro = 'saude' THEN
        v_tipo_plano_val := 'saude';
      ELSE
        v_tipo_plano_val := 'vida'; -- default
      END IF;

      -- Check if pendencia already exists
      IF NOT EXISTS (
        SELECT 1 FROM pendencias
        WHERE funcionario_id = NEW.id
          AND cnpj_id = NEW.cnpj_id
          AND tipo = 'cancelamento'
          AND tipo_plano = v_tipo_plano_val
          AND status = 'pendente'
      ) THEN
        v_protocolo := 'PND-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);

        INSERT INTO pendencias (
          protocolo, tipo, descricao, status,
          funcionario_id, cnpj_id, corretora_id,
          data_vencimento, tipo_plano
        ) VALUES (
          v_protocolo,
          'cancelamento',
          'Solicitação de exclusão do funcionário ' || NEW.nome,
          'pendente',
          NEW.id,
          NEW.cnpj_id,
          v_corretora_id,
          (now() + interval '30 days')::date,
          v_tipo_plano_val
        );
      END IF;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_criar_pendencia_exclusao ON funcionarios;
CREATE TRIGGER trg_criar_pendencia_exclusao
  AFTER UPDATE OF status ON funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION fn_criar_pendencia_exclusao();

-- Trigger function: create pendencia when new plan link is inserted with status pendente
CREATE OR REPLACE FUNCTION public.fn_criar_pendencia_novo_vinculo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_func record;
  v_corretora_id uuid;
  v_protocolo text;
  v_tipo_seguro text;
  v_tipo_plano_val tipo_plano;
BEGIN
  -- Only for pendente status inserts
  IF NEW.status = 'pendente' THEN
    -- Get funcionario info
    SELECT f.id, f.nome, f.cnpj_id INTO v_func
    FROM funcionarios f
    WHERE f.id = NEW.funcionario_id;

    IF v_func.id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get tipo_seguro from the plan
    SELECT dp.tipo_seguro INTO v_tipo_seguro
    FROM dados_planos dp
    WHERE dp.id = NEW.plano_id;

    -- Map to tipo_plano
    IF v_tipo_seguro = 'vida' THEN
      v_tipo_plano_val := 'vida';
    ELSIF v_tipo_seguro = 'saude' THEN
      v_tipo_plano_val := 'saude';
    ELSE
      v_tipo_plano_val := 'vida';
    END IF;

    -- Get corretora_id
    SELECT e.corretora_id INTO v_corretora_id
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    WHERE c.id = v_func.cnpj_id;

    IF v_corretora_id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Skip if pendencia already exists for this func+cnpj+tipo+ativacao
    IF NOT EXISTS (
      SELECT 1 FROM pendencias
      WHERE funcionario_id = NEW.funcionario_id
        AND cnpj_id = v_func.cnpj_id
        AND tipo = 'ativacao'
        AND tipo_plano = v_tipo_plano_val
        AND status = 'pendente'
    ) THEN
      v_protocolo := 'PND-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);

      INSERT INTO pendencias (
        protocolo, tipo, descricao, status,
        funcionario_id, cnpj_id, corretora_id,
        data_vencimento, tipo_plano
      ) VALUES (
        v_protocolo,
        'ativacao',
        'Ativação pendente do funcionário ' || v_func.nome || ' no plano ' || v_tipo_plano_val,
        'pendente',
        NEW.funcionario_id,
        v_func.cnpj_id,
        v_corretora_id,
        (now() + interval '30 days')::date,
        v_tipo_plano_val
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_criar_pendencia_novo_vinculo ON planos_funcionarios;
CREATE TRIGGER trg_criar_pendencia_novo_vinculo
  AFTER INSERT ON planos_funcionarios
  FOR EACH ROW
  EXECUTE FUNCTION fn_criar_pendencia_novo_vinculo();
