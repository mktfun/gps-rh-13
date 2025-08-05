
-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.marcar_mensagens_como_lidas(p_conversa_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.mensagens 
  SET lida = true, lida_em = NOW()
  WHERE conversa_id = p_conversa_id 
    AND remetente_id != auth.uid() 
    AND lida = false;
END;
$$;
