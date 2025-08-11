
-- 1) Criar enum status_matricula (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_matricula') THEN
    CREATE TYPE public.status_matricula AS ENUM ('ativo', 'pendente', 'inativo', 'exclusao_solicitada');
  END IF;
END$$;

-- 2) Criar tabela planos_funcionarios (idempotente)
CREATE TABLE IF NOT EXISTS public.planos_funcionarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id UUID NOT NULL REFERENCES public.dados_planos(id) ON DELETE CASCADE,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  status public.status_matricula NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT planos_funcionarios_unq UNIQUE (plano_id, funcionario_id)
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_planos_funcionarios_plano_id ON public.planos_funcionarios (plano_id);
CREATE INDEX IF NOT EXISTS idx_planos_funcionarios_funcionario_id ON public.planos_funcionarios (funcionario_id);

-- 3) Habilitar RLS
ALTER TABLE public.planos_funcionarios ENABLE ROW LEVEL SECURITY;

-- 4) Políticas de acesso

-- SELECT: Empresas (usuário empresa vê matrículas de seus funcionários),
-- Corretoras (carteira da corretora) e Admins.
DROP POLICY IF EXISTS planos_funcionarios_select ON public.planos_funcionarios;
CREATE POLICY planos_funcionarios_select
ON public.planos_funcionarios
FOR SELECT
USING (
  -- Empresa (via perfil)
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.profiles p ON c.empresa_id = p.empresa_id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND p.id = auth.uid()
      AND p.role = 'empresa'
  )
  OR
  -- Corretora (via carteira)
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND e.corretora_id = auth.uid()
  )
  OR
  -- Admin
  EXISTS (
    SELECT 1 FROM public.profiles pr
    WHERE pr.id = auth.uid() AND pr.role = 'admin'
  )
);

-- INSERT/UPDATE/DELETE: Corretora (carteira) e Admin
DROP POLICY IF EXISTS planos_funcionarios_iud_corretora_admin ON public.planos_funcionarios;
CREATE POLICY planos_funcionarios_iud_corretora_admin
ON public.planos_funcionarios
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND (e.corretora_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND (e.corretora_id = auth.uid()
           OR EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role = 'admin'))
  )
);

-- 5) Backfill de dados existentes com mapeamento de status robusto
-- Observação: NÃO removemos a coluna funcionarios.status nesta fase.
INSERT INTO public.planos_funcionarios (plano_id, funcionario_id, status)
SELECT
  dp.id AS plano_id,
  f.id AS funcionario_id,
  (
    CASE
      WHEN f.status::text = 'ativo' THEN 'ativo'::public.status_matricula
      WHEN f.status::text IN ('pendente', 'pendente_exclusao', 'edicao_solicitada') THEN 'pendente'::public.status_matricula
      WHEN f.status::text = 'exclusao_solicitada' THEN 'exclusao_solicitada'::public.status_matricula
      WHEN f.status::text IN ('desativado', 'arquivado') THEN 'inativo'::public.status_matricula
      ELSE 'pendente'::public.status_matricula
    END
  ) AS status
FROM public.funcionarios f
JOIN public.dados_planos dp ON f.cnpj_id = dp.cnpj_id
ON CONFLICT (plano_id, funcionario_id) DO NOTHING;
