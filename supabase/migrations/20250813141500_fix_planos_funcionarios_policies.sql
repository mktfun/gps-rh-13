-- Fix conflicting RLS policies for planos_funcionarios table
-- Remove the problematic policy and ensure the correct one is used

-- Drop the conflicting policy that only works for empresas
DROP POLICY IF EXISTS "Permitir inserção para donos da empresa" ON public.planos_funcionarios;

-- Ensure the main policy covers all cases correctly
DROP POLICY IF EXISTS planos_funcionarios_iud_corretora_admin ON public.planos_funcionarios;

-- Create a comprehensive policy that works for both corretoras and empresas
CREATE POLICY planos_funcionarios_insert_update_delete
ON public.planos_funcionarios
FOR ALL
TO authenticated
USING (
  -- Allow if user is a corretora that owns the company
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND e.corretora_id = auth.uid()
  )
  OR
  -- Allow if user is an empresa that owns the employee
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.profiles p ON p.empresa_id = c.empresa_id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND p.id = auth.uid()
      AND p.role = 'empresa'
  )
  OR
  -- Allow if user is admin
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
)
WITH CHECK (
  -- Same conditions for INSERT/UPDATE
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND e.corretora_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.profiles p ON p.empresa_id = c.empresa_id
    WHERE f.id = planos_funcionarios.funcionario_id
      AND p.id = auth.uid()
      AND p.role = 'empresa'
  )
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
