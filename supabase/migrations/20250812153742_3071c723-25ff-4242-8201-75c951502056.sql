
-- Garante/obtém conversa por protocolo, validando acesso
CREATE OR REPLACE FUNCTION public.iniciar_ou_obter_conversa_por_protocolo(
  p_empresa_id UUID,
  p_protocolo TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_corretora_id UUID;
  v_conversa_id UUID;
  v_has_access BOOLEAN := FALSE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se usuário é a empresa dona OU a corretora da empresa
  SELECT TRUE INTO v_has_access
  FROM public.profiles p
  WHERE p.id = v_user_id
    AND (
      (p.role = 'empresa' AND p.empresa_id = p_empresa_id)
      OR
      (p.role = 'corretora' AND EXISTS (
        SELECT 1 FROM public.empresas e
        WHERE e.id = p_empresa_id AND e.corretora_id = p.id
      ))
    )
  LIMIT 1;

  IF NOT COALESCE(v_has_access, FALSE) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Busca corretora dona da empresa
  SELECT e.corretora_id INTO v_corretora_id
  FROM public.empresas e
  WHERE e.id = p_empresa_id;

  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Empresa inválida ou sem corretora associada';
  END IF;

  -- Tenta localizar conversa existente para o protocolo
  SELECT c.id INTO v_conversa_id
  FROM public.conversas c
  WHERE c.empresa_id = p_empresa_id
    AND c.protocolo = p_protocolo
  LIMIT 1;

  -- Se não existe, cria
  IF v_conversa_id IS NULL THEN
    INSERT INTO public.conversas (empresa_id, corretora_id, protocolo)
    VALUES (p_empresa_id, v_corretora_id, p_protocolo)
    RETURNING id INTO v_conversa_id;
  END IF;

  RETURN v_conversa_id;
END;
$function$;

-- Índice para acelerar lookup por protocolo+empresa
CREATE INDEX IF NOT EXISTS conversas_protocolo_empresa_idx
  ON public.conversas (protocolo, empresa_id);
