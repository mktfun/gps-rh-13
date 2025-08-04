
-- First, let's drop the existing problematic policies
DROP POLICY IF EXISTS "empresas_access_policy" ON public.empresas;
DROP POLICY IF EXISTS "funcionarios_select_unified" ON public.funcionarios;
DROP POLICY IF EXISTS "Permitir leitura de CNPJs da própria empresa" ON public.cnpjs;

-- 1. Create new policy for empresas table
CREATE POLICY "Empresas podem ver sua própria empresa"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'empresa' AND
  id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
);

-- 2. Create new policy for cnpjs table
CREATE POLICY "Empresas podem ver seus próprios CNPJs"
ON public.cnpjs
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'empresa' AND
  empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
);

-- 3. Create new policy for funcionarios table
CREATE POLICY "Empresas podem ver seus próprios funcionários"
ON public.funcionarios
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'empresa' AND
  cnpj_id IN (
    SELECT id FROM public.cnpjs WHERE empresa_id = (SELECT empresa_id FROM public.profiles WHERE id = auth.uid())
  )
);
