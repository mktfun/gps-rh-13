
CREATE OR REPLACE FUNCTION public.iniciar_conversa_com_protocolo(
  p_empresa_id UUID,
  p_assunto_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_corretora_id UUID;
  v_protocolo_sequencial INT;
  v_protocolo_final TEXT;
  v_mensagem_padrao TEXT;
  v_conversa_id UUID;
BEGIN
  -- Passo 1: Validação e busca do corretora_id (A MUDANÇA CRÍTICA)
  SELECT e.corretora_id INTO v_corretora_id
  FROM public.empresas e
  JOIN public.profiles p ON e.id = p.empresa_id
  WHERE p.id = auth.uid() AND e.id = p_empresa_id;

  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Permissão negada ou empresa não encontrada para este usuário.';
  END IF;

  -- Passo 2: Geração do Protocolo
  SELECT COUNT(*) + 1 INTO v_protocolo_sequencial
  FROM public.conversas
  WHERE created_at::date = CURRENT_DATE;

  v_protocolo_final := 'BRK-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(v_protocolo_sequencial::TEXT, 4, '0');

  -- Passo 3: Criar a Conversa, AGORA INCLUINDO O corretora_id
  INSERT INTO public.conversas (empresa_id, corretora_id, protocolo)
  VALUES (p_empresa_id, v_corretora_id, v_protocolo_final)
  RETURNING id INTO v_conversa_id;

  -- Passo 4: Inserir a Primeira Mensagem
  SELECT mensagem_padrao INTO v_mensagem_padrao
  FROM public.assuntos_atendimento
  WHERE id = p_assunto_id;

  INSERT INTO public.mensagens (conversa_id, remetente_id, conteudo)
  VALUES (v_conversa_id, auth.uid(), v_mensagem_padrao);

  RETURN v_conversa_id;
END;
$$;
