
-- PRIMEIRO, A GENTE MATA AS POLÍTICAS VELHAS E CAGADAS.
DROP POLICY IF EXISTS "Empresas podem ver sua própria empresa" ON public.empresas;
DROP POLICY IF EXISTS "Empresas podem ver seus próprios CNPJs" ON public.cnpjs;
DROP POLICY IF EXISTS "Empresas podem ver seus próprios funcionários" ON public.funcionarios;

-- AGORA, A GENTE CRIA AS POLÍTICAS CERTAS, QUE FUNCIONAM.

-- FUNÇÕES HELPER (SE NÃO EXISTIREM, CRIE-AS)
-- Esta função busca a role do usuário de forma segura e evita recursão.
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Esta função busca o empresa_id do usuário de forma segura.
CREATE OR REPLACE FUNCTION get_my_empresa_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT empresa_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Política para a tabela `empresas`
CREATE POLICY "Empresas podem ver sua própria empresa"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'empresa') AND
  id = get_my_empresa_id()
);

-- 2. Política para a tabela `cnpjs`
CREATE POLICY "Empresas podem ver seus próprios CNPJs"
ON public.cnpjs
FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'empresa') AND
  empresa_id = get_my_empresa_id()
);

-- 3. Política para a tabela `funcionarios`
CREATE POLICY "Empresas podem ver seus próprios funcionários"
ON public.funcionarios
FOR SELECT
TO authenticated
USING (
  (get_my_role() = 'empresa') AND
  cnpj_id IN (
    SELECT id FROM public.cnpjs WHERE empresa_id = get_my_empresa_id()
  )
);
