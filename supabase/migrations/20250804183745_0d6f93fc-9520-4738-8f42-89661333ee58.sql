
CREATE OR REPLACE FUNCTION public.iniciar_conversa_com_protocolo(
  p_empresa_id UUID,
  p_assunto_id UUID
)
RETURNS UUID -- Retorna o ID da nova conversa
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANTE: Permite que a função ignore RLS para inserir a msg padrão
AS $$
DECLARE
  v_usuario_empresa_id UUID;
  v_protocolo_sequencial INT;
  v_protocolo_final TEXT;
  v_mensagem_padrao TEXT;
  v_conversa_id UUID;
  v_remetente_id UUID;
BEGIN
  -- Passo 1: Validação de Permissão
  -- Pega o ID da empresa do usuário logado (assumindo que está em 'raw_user_meta_data')
  SELECT raw_user_meta_data->>'empresa_id' INTO v_usuario_empresa_id FROM auth.users WHERE id = auth.uid();

  -- Se o usuário não pertence à empresa que está tentando abrir o chat, lança um erro.
  IF v_usuario_empresa_id != p_empresa_id THEN
    RAISE EXCEPTION 'Permissão negada: Usuário não pertence a esta empresa.';
  END IF;

  -- Passo 2: Geração do Protocolo Sequencial Diário (sua sugestão implementada)
  -- Conta quantos protocolos já foram criados hoje
  SELECT COUNT(*) + 1 INTO v_protocolo_sequencial
  FROM public.conversas
  WHERE created_at::date = CURRENT_DATE;

  -- Formata o protocolo: BRK-YYYYMMDD-XXXX (com 4 dígitos)
  v_protocolo_final := 'BRK-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(v_protocolo_sequencial::TEXT, 4, '0');

  -- Passo 3: Criar a Conversa
  INSERT INTO public.conversas (empresa_id, protocolo)
  VALUES (p_empresa_id, v_protocolo_final)
  RETURNING id INTO v_conversa_id;

  -- Passo 4: Inserir a Primeira Mensagem
  -- Busca a mensagem padrão do assunto
  SELECT mensagem_padrao INTO v_mensagem_padrao
  FROM public.assuntos_atendimento
  WHERE id = p_assunto_id;

  -- Pega o ID do usuário que iniciou a conversa
  v_remetente_id := auth.uid();

  -- Insere a mensagem na tabela de mensagens
  INSERT INTO public.mensagens (conversa_id, remetente_id, conteudo)
  VALUES (v_conversa_id, v_remetente_id, v_mensagem_padrao);

  -- Passo 5: Retornar o ID da nova conversa
  RETURN v_conversa_id;
END;
$$;
