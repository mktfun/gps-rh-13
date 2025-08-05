
CREATE OR REPLACE FUNCTION deletar_conversa(p_conversa_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verifica se o usuário logado é participante da conversa que ele está tentando deletar
  IF NOT EXISTS (
    SELECT 1 FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.id = p_conversa_id AND (
      c.empresa_id = (SELECT prof.empresa_id FROM public.profiles prof WHERE prof.id = auth.uid()) OR
      e.corretora_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Permissão negada para deletar esta conversa.';
  END IF;

  -- Se a permissão for válida, deleta as mensagens e depois a conversa
  DELETE FROM public.mensagens WHERE conversa_id = p_conversa_id;
  DELETE FROM public.conversas WHERE id = p_conversa_id;
END;
$$;
