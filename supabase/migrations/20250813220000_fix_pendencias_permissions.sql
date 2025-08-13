-- Fix pendencias RLS policies to ensure proper permission handling
-- Drop existing problematic policies first
DROP POLICY IF EXISTS "Corretoras podem gerenciar pendências" ON public.pendencias;
DROP POLICY IF EXISTS "pendencias_select_by_corretora_id" ON public.pendencias;

-- Create clearer and more specific policies

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

-- Policy 4: Allow INSERT/UPDATE/DELETE for corretoras only
CREATE POLICY "pendencias_insert_update_delete_corretora" ON public.pendencias
FOR ALL TO authenticated
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

-- Policy 5: Allow INSERT/UPDATE/DELETE for admins
CREATE POLICY "pendencias_insert_update_delete_admin" ON public.pendencias
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

-- Create index for better performance on corretora_id lookups
CREATE INDEX IF NOT EXISTS idx_pendencias_corretora_id ON public.pendencias(corretora_id);

-- Add comment explaining the permission structure
COMMENT ON TABLE public.pendencias IS 'Pendencias table with RLS policies: empresas can SELECT their own, corretoras and admins can manage pendencias of their companies';
