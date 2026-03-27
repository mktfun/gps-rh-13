CREATE POLICY "Empresas podem solicitar exclusao"
ON public.planos_funcionarios
FOR UPDATE
TO authenticated
USING (
  (get_my_role() = 'empresa'::text)
  AND EXISTS (
    SELECT 1 FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND c.empresa_id = get_my_empresa_id()
  )
)
WITH CHECK (
  (get_my_role() = 'empresa'::text)
  AND status = 'exclusao_solicitada'::status_matricula
  AND EXISTS (
    SELECT 1 FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND c.empresa_id = get_my_empresa_id()
  )
);