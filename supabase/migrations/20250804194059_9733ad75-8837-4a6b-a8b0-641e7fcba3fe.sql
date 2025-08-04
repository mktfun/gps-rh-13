
-- SCRIPT DE CORREÇÃO DEFINITIVA PARA INSERT - RODE ESTA MERDA

-- Primeiro, garantimos que qualquer política de INSERT com este nome seja destruída.
DROP POLICY IF EXISTS "Participantes podem criar mensagens" ON public.mensagens;

-- Agora, criamos a política CORRETA que faltava.
CREATE POLICY "Participantes podem criar mensagens"
ON public.mensagens FOR INSERT
TO authenticated
WITH CHECK (
  -- A regra: você pode INSERIR uma mensagem se você for um participante da conversa.
  EXISTS (
    SELECT 1 FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.id = mensagens.conversa_id
      AND (
        -- Condição 1: Você é o usuário da empresa desta conversa
        c.empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
        OR
        -- Condição 2: Você é a corretora que gerencia a empresa desta conversa
        e.corretora_id = auth.uid()
      )
  )
);
