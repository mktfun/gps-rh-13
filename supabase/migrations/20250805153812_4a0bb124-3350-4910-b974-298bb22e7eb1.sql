
CREATE OR REPLACE FUNCTION public.get_conversas_usuario()
RETURNS TABLE (conversa_id UUID, empresa_nome TEXT, created_at TIMESTAMPTZ, protocolo TEXT)
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_user_empresa_id UUID;
BEGIN
  SELECT p.role::TEXT, p.empresa_id INTO v_user_role, v_user_empresa_id FROM public.profiles p WHERE p.id = auth.uid();
  IF v_user_role = 'corretora' THEN
    RETURN QUERY SELECT c.id, e.nome, c.created_at, c.protocolo FROM public.conversas c JOIN public.empresas e ON c.empresa_id = e.id WHERE e.corretora_id = auth.uid() ORDER BY c.created_at DESC;
  ELSE
    RETURN QUERY SELECT c.id, e.nome, c.created_at, c.protocolo FROM public.conversas c JOIN public.empresas e ON c.empresa_id = e.id WHERE c.empresa_id = v_user_empresa_id ORDER BY c.created_at DESC;
  END IF;
END;
$$;
