
-- Aumentar o limite de tamanho do conteúdo das mensagens para até 5000 caracteres

ALTER TABLE public.mensagens
  DROP CONSTRAINT IF EXISTS mensagens_conteudo_check;

ALTER TABLE public.mensagens
  ADD CONSTRAINT mensagens_conteudo_check
  CHECK (
    char_length(conteudo) > 0
    AND char_length(conteudo) <= 5000
  );
