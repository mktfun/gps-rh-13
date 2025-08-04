
-- Adicionar coluna para timestamp de leitura
ALTER TABLE public.mensagens ADD COLUMN lida_em TIMESTAMPTZ;

-- Atualizar mensagens já marcadas como lidas para ter timestamp
UPDATE public.mensagens 
SET lida_em = created_at 
WHERE lida = true;

-- Criar função RPC melhorada para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION marcar_mensagens_como_lidas(p_conversa_id UUID)
RETURNS void 
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.mensagens
  SET 
    lida = true,
    lida_em = now()
  WHERE conversa_id = p_conversa_id
    AND remetente_id != auth.uid()
    AND lida_em IS NULL;
END;
$$ LANGUAGE plpgsql;
