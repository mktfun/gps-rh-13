
-- CORREÇÃO DEFINITIVA DA RLS PARA MENSAGENS
-- Remover a política antiga conflitante e garantir que apenas a correta permaneça

-- Remover a política antiga que está causando conflito
DROP POLICY IF EXISTS "Participantes podem inserir mensagens em suas conversas" ON public.mensagens;

-- Garantir que a política correta existe (recriar se necessário)
DROP POLICY IF EXISTS "Participantes podem criar mensagens" ON public.mensagens;

CREATE POLICY "Participantes podem criar mensagens"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (
  -- Verifica se o usuário logado (quem está inserindo) faz parte da conversa
  EXISTS (
    SELECT 1
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.id = mensagens.conversa_id -- A mensagem pertence a esta conversa
      AND (
        -- E o usuário logado é o da empresa da conversa
        c.empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
        OR
        -- OU o usuário logado é a corretora dona da empresa da conversa
        e.corretora_id = auth.uid()
      )
  )
);
