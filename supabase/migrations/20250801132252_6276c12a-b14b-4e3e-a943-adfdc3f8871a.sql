
-- Remove a política atual restritiva
DROP POLICY IF EXISTS "Usuários podem ver mensagens de suas conversas" ON public.mensagens;

-- Cria a nova política que permite ver TODAS as mensagens das conversas onde o usuário participa
CREATE POLICY "Participantes podem ver TODAS as mensagens de suas conversas"
ON public.mensagens FOR SELECT
TO authenticated
USING (
  mensagens.conversa_id IN (SELECT id FROM public.conversas)
);

-- Também vamos atualizar a política de UPDATE para permitir marcar mensagens como lidas
DROP POLICY IF EXISTS "Usuários podem atualizar mensagens de suas conversas" ON public.mensagens;

CREATE POLICY "Participantes podem marcar mensagens como lidas"
ON public.mensagens FOR UPDATE
TO authenticated
USING (
  mensagens.conversa_id IN (SELECT id FROM public.conversas)
)
WITH CHECK (
  mensagens.conversa_id IN (SELECT id FROM public.conversas)
);
