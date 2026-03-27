

# Fix: Empresa cannot request employee exclusion

## Problem
The `planos_funcionarios` table has no UPDATE RLS policy for `empresa` role. When an empresa tries to change status to `exclusao_solicitada`, the update is blocked by RLS, returning a 406 error.

## Solution

**Add an UPDATE RLS policy** on `planos_funcionarios` for empresas, restricted to only setting status to `exclusao_solicitada`:

```sql
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
```

The `WITH CHECK` clause ensures empresas can **only** set status to `exclusao_solicitada` -- they cannot activate, deactivate, or perform any other status change.

## Files
1. **New migration** -- single SQL policy creation, no code changes needed

