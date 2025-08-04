
-- =================================================================
-- FASE 1: LIMPEZA TOTAL (TERRA ARRASADA)
-- Desabilitar e reabilitar a RLS força um reset.
-- =================================================================
ALTER TABLE public.empresas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpjs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios DISABLE ROW LEVEL SECURITY;

-- Removendo TODAS as políticas de SELECT e INSERT existentes.
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.empresas;
DROP POLICY IF EXISTS "Empresas podem ver sua própria empresa" ON public.empresas;
DROP POLICY IF EXISTS "Corretoras podem ver suas próprias empresas" ON public.empresas;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.empresas;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cnpjs;
DROP POLICY IF EXISTS "Empresas podem ver seus próprios CNPJs" ON public.cnpjs;
DROP POLICY IF EXISTS "Corretoras podem ver CNPJs de suas empresas" ON public.cnpjs;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.cnpjs;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.funcionarios;
DROP POLICY IF EXISTS "Empresas podem ver seus próprios funcionários" ON public.funcionarios;
DROP POLICY IF EXISTS "Corretoras podem ver funcionarios de suas empresas" ON public.funcionarios;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.funcionarios;

-- Reabilitar RLS, agora com as tabelas limpas de políticas velhas.
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- FASE 2: RECONSTRUÇÃO (DO JEITO CERTO)
-- Criando as funções helper que não causam recursão.
-- =================================================================
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_my_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- Políticas para a tabela `EMPRESAS`
-- =================================================================
CREATE POLICY "Corretoras podem ver e criar suas empresas"
ON public.empresas FOR ALL TO authenticated
USING (get_my_role() = 'corretora' AND corretora_id = auth.uid())
WITH CHECK (get_my_role() = 'corretora' AND corretora_id = auth.uid());

CREATE POLICY "Empresas podem ver sua própria empresa"
ON public.empresas FOR SELECT TO authenticated
USING (get_my_role() = 'empresa' AND id = get_my_empresa_id());

-- =================================================================
-- Políticas para a tabela `CNPJS`
-- =================================================================
CREATE POLICY "Corretoras podem gerenciar CNPJs de suas empresas"
ON public.cnpjs FOR ALL TO authenticated
USING (get_my_role() = 'corretora' AND empresa_id IN (SELECT id FROM public.empresas WHERE corretora_id = auth.uid()))
WITH CHECK (get_my_role() = 'corretora' AND empresa_id IN (SELECT id FROM public.empresas WHERE corretora_id = auth.uid()));

CREATE POLICY "Empresas podem ver seus próprios CNPJs"
ON public.cnpjs FOR SELECT TO authenticated
USING (get_my_role() = 'empresa' AND empresa_id = get_my_empresa_id());

-- =================================================================
-- Políticas para a tabela `FUNCIONARIOS`
-- =================================================================
CREATE POLICY "Corretoras podem gerenciar funcionarios de suas empresas"
ON public.funcionarios FOR ALL TO authenticated
USING (get_my_role() = 'corretora' AND cnpj_id IN (SELECT c.id FROM public.cnpjs c JOIN public.empresas e ON c.empresa_id = e.id WHERE e.corretora_id = auth.uid()))
WITH CHECK (get_my_role() = 'corretora' AND cnpj_id IN (SELECT c.id FROM public.cnpjs c JOIN public.empresas e ON c.empresa_id = e.id WHERE e.corretora_id = auth.uid()));

CREATE POLICY "Empresas podem ver seus próprios funcionários"
ON public.funcionarios FOR SELECT TO authenticated
USING (get_my_role() = 'empresa' AND cnpj_id IN (SELECT id FROM public.cnpjs WHERE empresa_id = get_my_empresa_id()));

CREATE POLICY "Empresas podem gerenciar seus próprios funcionários"
ON public.funcionarios FOR INSERT TO authenticated
WITH CHECK (get_my_role() = 'empresa' AND cnpj_id IN (SELECT id FROM public.cnpjs WHERE empresa_id = get_my_empresa_id()));

CREATE POLICY "Empresas podem atualizar seus próprios funcionários"
ON public.funcionarios FOR UPDATE TO authenticated
USING (get_my_role() = 'empresa' AND cnpj_id IN (SELECT id FROM public.cnpjs WHERE empresa_id = get_my_empresa_id()));
