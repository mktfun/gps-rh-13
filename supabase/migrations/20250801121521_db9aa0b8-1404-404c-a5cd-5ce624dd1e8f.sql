
CREATE OR REPLACE FUNCTION public.find_or_create_conversation()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empresa_id uuid;
  v_corretora_id uuid;
  v_conversa_id uuid;
BEGIN
  -- Pega o ID da empresa do perfil do usuário logado
  SELECT empresa_id INTO v_empresa_id FROM public.profiles WHERE id = auth.uid();

  -- Se não for um usuário de empresa, retorna erro
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não é do tipo empresa';
  END IF;

  -- Acha o ID da corretora associada a esta empresa
  SELECT corretora_id INTO v_corretora_id FROM public.empresas WHERE id = v_empresa_id;

  -- Procura por uma conversa existente
  SELECT id INTO v_conversa_id FROM public.conversas 
  WHERE empresa_id = v_empresa_id AND corretora_id = v_corretora_id;

  -- Se a conversa já existir, retorna o ID dela
  IF v_conversa_id IS NOT NULL THEN
    RETURN v_conversa_id;
  END IF;

  -- Se não existir, cria uma nova conversa e retorna o novo ID
  INSERT INTO public.conversas (empresa_id, corretora_id)
  VALUES (v_empresa_id, v_corretora_id)
  RETURNING id INTO v_conversa_id;

  RETURN v_conversa_id;
END;
$$;
