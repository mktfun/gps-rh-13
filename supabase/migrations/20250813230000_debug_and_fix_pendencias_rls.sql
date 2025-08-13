-- Debug and fix RLS policies for pendencias table
-- Remove all existing policies to start fresh
DROP POLICY IF EXISTS "pendencias_select_empresa" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_select_corretora" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_select_admin" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_insert_update_delete_corretora" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_insert_update_delete_admin" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_select_by_corretora_id" ON public.pendencias;
DROP POLICY IF EXISTS "Corretoras podem gerenciar pendências" ON public.pendencias;

-- Ensure RLS is enabled
ALTER TABLE public.pendencias ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow SELECT for companies (read-only access to their own pendencias)
CREATE POLICY "pendencias_select_empresa" ON public.pendencias
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    JOIN cnpjs c ON c.empresa_id = p.empresa_id
    WHERE p.id = auth.uid()
      AND p.role = 'empresa'
      AND c.id = pendencias.cnpj_id
  )
);

-- Policy 2: Allow SELECT for corretoras (read access to pendencias of their companies)
CREATE POLICY "pendencias_select_corretora" ON public.pendencias
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'corretora'
      AND p.id = pendencias.corretora_id
  )
);

-- Policy 3: Allow SELECT for admins
CREATE POLICY "pendencias_select_admin" ON public.pendencias
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Policy 4: Allow INSERT for corretoras (WITH CHECK clause is crucial)
CREATE POLICY "pendencias_insert_corretora" ON public.pendencias
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'corretora'
      AND p.id = pendencias.corretora_id
  )
);

-- Policy 5: Allow UPDATE/DELETE for corretoras
CREATE POLICY "pendencias_update_delete_corretora" ON public.pendencias
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'corretora'
      AND p.id = pendencias.corretora_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'corretora'
      AND p.id = pendencias.corretora_id
  )
);

-- Policy 6: Allow DELETE for corretoras
CREATE POLICY "pendencias_delete_corretora" ON public.pendencias
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'corretora'
      AND p.id = pendencias.corretora_id
  )
);

-- Policy 7: Allow all operations for admins
CREATE POLICY "pendencias_admin_all" ON public.pendencias
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pendencias_corretora_id ON public.pendencias(corretora_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_cnpj_id ON public.pendencias(cnpj_id);
CREATE INDEX IF NOT EXISTS idx_pendencias_funcionario_id ON public.pendencias(funcionario_id);

-- Add helpful comments
COMMENT ON TABLE public.pendencias IS 'Pendencias table with RLS: empresas SELECT only, corretoras full access to their records, admins full access';

-- Create a debug function to help troubleshoot RLS issues
CREATE OR REPLACE FUNCTION public.debug_pendencias_permissions(p_corretora_id UUID)
RETURNS TABLE (
  current_user_id UUID,
  profile_role TEXT,
  profile_empresa_id UUID,
  has_corretora_profile BOOLEAN,
  can_insert_test BOOLEAN
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    auth.uid() as current_user_id,
    p.role as profile_role,
    p.empresa_id as profile_empresa_id,
    (p.role = 'corretora' AND p.id = p_corretora_id) as has_corretora_profile,
    (p.role = 'admin' OR (p.role = 'corretora' AND p.id = p_corretora_id)) as can_insert_test
  FROM profiles p
  WHERE p.id = auth.uid();
$$;

-- Grant execute permission on the debug function
GRANT EXECUTE ON FUNCTION public.debug_pendencias_permissions(UUID) TO authenticated;
