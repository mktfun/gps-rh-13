
-- 1) Adicionar coluna corretora_id em pendencias (escopo por corretora)
ALTER TABLE public.pendencias
ADD COLUMN IF NOT EXISTS corretora_id uuid;

-- 2) Popular registros existentes a partir do CNPJ -> Empresa -> Corretora
UPDATE public.pendencias p
SET corretora_id = e.corretora_id
FROM public.cnpjs c
JOIN public.empresas e ON e.id = c.empresa_id
WHERE p.cnpj_id = c.id
  AND p.corretora_id IS NULL;

-- 3) Garantir integridade por FK ao profiles.id (evitamos referenciar auth.users)
ALTER TABLE public.pendencias
DROP CONSTRAINT IF EXISTS pendencias_corretora_id_fkey;

ALTER TABLE public.pendencias
ADD CONSTRAINT pendencias_corretora_id_fkey
FOREIGN KEY (corretora_id)
REFERENCES public.profiles(id)
ON UPDATE CASCADE
ON DELETE SET NULL;

-- 4) Se todos os registros foram populados corretamente, podemos reforçar NOT NULL
--    Caso haja chance de dados órfãos, comente a linha abaixo.
ALTER TABLE public.pendencias
ALTER COLUMN corretora_id SET NOT NULL;

-- 5) Trigger para manter corretora_id sempre sincronizado
CREATE OR REPLACE FUNCTION public.set_pendencia_corretora_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Buscar a corretora dona do CNPJ da pendência
  SELECT e.corretora_id
  INTO NEW.corretora_id
  FROM public.cnpjs c
  JOIN public.empresas e ON e.id = c.empresa_id
  WHERE c.id = NEW.cnpj_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_pendencia_corretora_id ON public.pendencias;

CREATE TRIGGER trg_set_pendencia_corretora_id
BEFORE INSERT OR UPDATE OF cnpj_id
ON public.pendencias
FOR EACH ROW
EXECUTE FUNCTION public.set_pendencia_corretora_id();

-- 6) Índices para performance nos filtros comuns
CREATE INDEX IF NOT EXISTS idx_pendencias_corretora_id
  ON public.pendencias(corretora_id);

CREATE INDEX IF NOT EXISTS idx_pendencias_data_vencimento
  ON public.pendencias(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_pendencias_protocolo
  ON public.pendencias(protocolo);

-- 7) (Opcional mas recomendado) Policy explícita por corretora_id
--    Mantemos as policies atuais (por join) e adicionamos uma simples por coluna.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pendencias'
      AND policyname = 'pendencias_select_by_corretora_id'
  ) THEN
    CREATE POLICY pendencias_select_by_corretora_id
      ON public.pendencias
      FOR SELECT
      USING (corretora_id = auth.uid());
  END IF;
END;
$$;
