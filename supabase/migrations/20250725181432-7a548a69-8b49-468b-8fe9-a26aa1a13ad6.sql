
-- Remover a política existente para UPDATE se houver conflito
DROP POLICY IF EXISTS "Empresas podem atualizar seus próprios funcionários" ON public.funcionarios;

-- Criar nova política para permitir que empresas atualizem seus funcionários
CREATE POLICY "Empresas podem atualizar seus próprios funcionários"
ON public.funcionarios
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o usuário tem role 'empresa' e se o funcionário pertence à empresa dele
  (get_my_role() = 'empresa') AND 
  (cnpj_id IN (
    SELECT cnpjs.id 
    FROM cnpjs 
    WHERE cnpjs.empresa_id = get_my_empresa_id()
  ))
)
WITH CHECK (
  -- Mesma verificação para o WITH CHECK
  (get_my_role() = 'empresa') AND 
  (cnpj_id IN (
    SELECT cnpjs.id 
    FROM cnpjs 
    WHERE cnpjs.empresa_id = get_my_empresa_id()
  ))
);
