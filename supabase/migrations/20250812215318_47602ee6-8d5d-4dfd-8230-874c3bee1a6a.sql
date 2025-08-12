
-- Criar pendência de ativação automaticamente após inserir funcionário
-- Idempotente: só cria se não existir uma pendência 'ativacao' pendente para o funcionário

CREATE OR REPLACE FUNCTION public.criar_pendencia_ativacao_apos_inserir_funcionario()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_corretora_id uuid;
  v_ja_existe boolean;
  v_protocolo text;
  v_data_vencimento date;
BEGIN
  -- Consideramos apenas funcionários inseridos com status 'pendente'
  IF NEW.status IS NULL OR NEW.status::text NOT IN ('pendente') THEN
    RETURN NEW;
  END IF;

  -- Evitar duplicidade: já existe pendência de ativação pendente para este funcionário?
  SELECT EXISTS (
    SELECT 1
    FROM public.pendencias p
    WHERE p.funcionario_id = NEW.id
      AND p.tipo = 'ativacao'
      AND p.status = 'pendente'
  ) INTO v_ja_existe;

  IF v_ja_existe THEN
    RETURN NEW;
  END IF;

  -- Obter corretora dona do CNPJ do funcionário
  SELECT e.corretora_id
    INTO v_corretora_id
  FROM public.cnpjs c
  JOIN public.empresas e ON e.id = c.empresa_id
  WHERE c.id = NEW.cnpj_id;

  -- Se não conseguirmos resolver a corretora, não criamos pendência
  IF v_corretora_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Gerar protocolo e data de vencimento (+7 dias)
  v_protocolo := 'ACT-' || EXTRACT(EPOCH FROM now())::bigint || '-' || substr(md5(random()::text), 1, 6);
  v_data_vencimento := (now() + interval '7 days')::date;

  -- Inserir pendência (rodará com privilégios do dono da função, contornando RLS)
  INSERT INTO public.pendencias (
    protocolo,
    tipo,
    descricao,
    funcionario_id,
    cnpj_id,
    corretora_id,
    status,
    data_vencimento
  ) VALUES (
    v_protocolo,
    'ativacao',
    'Ativação pendente para o novo funcionário ' || NEW.nome || '.',
    NEW.id,
    NEW.cnpj_id,
    v_corretora_id,
    'pendente',
    v_data_vencimento
  );

  RETURN NEW;
END;
$$;

-- Criar/atualizar trigger
DROP TRIGGER IF EXISTS trg_criar_pendencia_ativacao ON public.funcionarios;

CREATE TRIGGER trg_criar_pendencia_ativacao
AFTER INSERT ON public.funcionarios
FOR EACH ROW
EXECUTE FUNCTION public.criar_pendencia_ativacao_apos_inserir_funcionario();

-- Opcional de segurança extra: evitar duplicidade por índice parcial (não falhará se já existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'uniq_pend_ativacao_por_funcionario_pendente'
  ) THEN
    CREATE UNIQUE INDEX uniq_pend_ativacao_por_funcionario_pendente
      ON public.pendencias(funcionario_id)
      WHERE tipo = 'ativacao' AND status = 'pendente';
  END IF;
END $$;
