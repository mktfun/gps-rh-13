-- Habilita a RLS na tabela, se já não estiver
ALTER TABLE "public"."planos_funcionarios" ENABLE ROW LEVEL SECURITY;

-- Apaga políticas velhas que possam estar conflitando
DROP POLICY IF EXISTS "Corretoras podem ver vínculos de suas empresas" ON "public"."planos_funcionarios";
DROP POLICY IF EXISTS "Empresas podem ver seus vínculos" ON "public"."planos_funcionarios";
DROP POLICY IF EXISTS "planos_funcionarios_select" ON "public"."planos_funcionarios";
DROP POLICY IF EXISTS "Permitir inserção para donos da empresa" ON "public"."planos_funcionarios";

--------------------------------------------------------------------------------
-- A POLÍTICA QUE VAI RESOLVER SUA VIDA PARA A CORRETORA - SELECT
--------------------------------------------------------------------------------
CREATE POLICY "Corretoras podem ver vínculos de suas empresas"
ON "public"."planos_funcionarios" FOR SELECT
TO "authenticated"
USING (
  (get_my_role() = 'corretora' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND e.corretora_id = auth.uid()
  ))
);

--------------------------------------------------------------------------------
-- A POLÍTICA PARA A EMPRESA - SELECT
--------------------------------------------------------------------------------
CREATE POLICY "Empresas podem ver seus vínculos"
ON "public"."planos_funcionarios" FOR SELECT
TO "authenticated"
USING (
  (get_my_role() = 'empresa' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND c.empresa_id = get_my_empresa_id()
  ))
);

--------------------------------------------------------------------------------
-- POLÍTICAS PARA INSERÇÃO (manter as que já funcionavam)
--------------------------------------------------------------------------------
CREATE POLICY "Corretoras podem criar vínculos"
ON "public"."planos_funcionarios" FOR INSERT
TO "authenticated"
WITH CHECK (
  get_my_role() = 'corretora' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND e.corretora_id = auth.uid()
  )
);

CREATE POLICY "Empresas podem criar vínculos"
ON "public"."planos_funcionarios" FOR INSERT
TO "authenticated"
WITH CHECK (
  get_my_role() = 'empresa' AND EXISTS (
    SELECT 1
    FROM public.dados_planos dp
    JOIN public.cnpjs c ON dp.cnpj_id = c.id
    WHERE
      dp.id = planos_funcionarios.plano_id AND c.empresa_id = get_my_empresa_id()
  )
);

--------------------------------------------------------------------------------
-- POLÍTICAS PARA UPDATE/DELETE (corretoras e admins)
--------------------------------------------------------------------------------
CREATE POLICY "Corretoras podem atualizar vínculos"
ON "public"."planos_funcionarios" FOR UPDATE
TO "authenticated"
USING (
  get_my_role() = 'corretora' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND e.corretora_id = auth.uid()
  )
)
WITH CHECK (
  get_my_role() = 'corretora' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND e.corretora_id = auth.uid()
  )
);

CREATE POLICY "Corretoras podem deletar vínculos"
ON "public"."planos_funcionarios" FOR DELETE
TO "authenticated"
USING (
  get_my_role() = 'corretora' AND EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE
      f.id = planos_funcionarios.funcionario_id AND e.corretora_id = auth.uid()
  )
);