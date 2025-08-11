
-- Criar política para permitir inserção na tabela planos_funcionarios
-- para usuários que são donos da empresa à qual o plano pertence
CREATE POLICY "Permitir inserção para donos da empresa"
ON public.planos_funcionarios
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE dp.id = plano_id 
    AND c.empresa_id = (
      SELECT empresa_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
);
