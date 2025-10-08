-- Habilita a RLS na tabela pendencias, se já não estiver.
ALTER TABLE "public"."pendencias" ENABLE ROW LEVEL SECURITY;

-- Apaga políticas velhas pra não dar conflito.
DROP POLICY IF EXISTS "Corretoras podem ver suas pendências" ON "public"."pendencias";
DROP POLICY IF EXISTS "Empresas podem ver suas pendências" ON "public"."pendencias";
DROP POLICY IF EXISTS "Corretoras podem gerenciar pendências" ON "public"."pendencias";
DROP POLICY IF EXISTS "Corretoras podem ver pendências de suas empresas" ON "public"."pendencias";
DROP POLICY IF EXISTS "Empresas podem ver suas próprias pendências" ON "public"."pendencias";
DROP POLICY IF EXISTS "pendencias_select_by_corretora_id" ON "public"."pendencias";

-- POLÍTICA CORRETA PARA A CORRETORA - SELECT
-- Permite que a corretora veja QUALQUER pendência que esteja associada a ela.
CREATE POLICY "Corretoras podem ver suas pendências"
ON "public"."pendencias" FOR SELECT
TO "authenticated"
USING (
  (get_my_role() = 'corretora' AND corretora_id = auth.uid())
);

-- POLÍTICA CORRETA PARA A EMPRESA - SELECT
-- Permite que a empresa veja pendências dos seus CNPJs.
CREATE POLICY "Empresas podem ver suas pendências"
ON "public"."pendencias" FOR SELECT
TO "authenticated"
USING (
  (get_my_role() = 'empresa' AND cnpj_id IN (
    SELECT c.id FROM cnpjs c WHERE c.empresa_id = get_my_empresa_id()
  ))
);

-- Permissão pra corretora criar pendências
CREATE POLICY "Corretoras podem criar pendências"
ON "public"."pendencias" FOR INSERT
TO "authenticated"
WITH CHECK (
  get_my_role() = 'corretora' AND corretora_id = auth.uid()
);

-- Permissão pra corretora atualizar pendências
CREATE POLICY "Corretoras podem atualizar suas pendências"
ON "public"."pendencias" FOR UPDATE
TO "authenticated"
USING (
  get_my_role() = 'corretora' AND corretora_id = auth.uid()
)
WITH CHECK (
  get_my_role() = 'corretora' AND corretora_id = auth.uid()
);

-- Permissão pra corretora deletar pendências
CREATE POLICY "Corretoras podem deletar suas pendências"
ON "public"."pendencias" FOR DELETE
TO "authenticated"
USING (
  get_my_role() = 'corretora' AND corretora_id = auth.uid()
);