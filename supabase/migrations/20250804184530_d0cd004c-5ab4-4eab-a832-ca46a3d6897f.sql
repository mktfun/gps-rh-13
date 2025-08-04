
-- Remove a política antiga restritiva
DROP POLICY IF EXISTS "Participantes podem ver suas conversas" ON public.conversas;

-- Cria a nova política que permite corretoras verem conversas de suas empresas
CREATE POLICY "Usuários podem ver suas conversas e corretoras as de suas empresas"
ON public.conversas FOR SELECT
TO authenticated
USING (
  -- Regra 1: O usuário da empresa pode ver a conversa (empresa_id no profiles)
  (empresa_id = (SELECT empresa_id FROM profiles WHERE id = auth.uid()))
  OR
  -- Regra 2: A corretora pode ver a conversa se a empresa for dela
  (EXISTS (
    SELECT 1
    FROM public.empresas e
    WHERE e.id = conversas.empresa_id AND e.corretora_id = auth.uid()
  ))
);
