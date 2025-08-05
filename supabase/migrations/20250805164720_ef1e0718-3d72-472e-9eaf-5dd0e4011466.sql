
-- SCRIPT PARA GARANTIR QUE O BACKEND FAÇA O TRABALHO DELE
CREATE OR REPLACE FUNCTION public.get_conversas_usuario()
RETURNS TABLE (conversa_id UUID, empresa_nome TEXT, created_at TIMESTAMPTZ, protocolo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_role TEXT;
  v_user_empresa_id UUID;
BEGIN
  -- Pega a role e o empresa_id do usuário logado a partir da tabela profiles
  SELECT
    p.role::TEXT,
    p.empresa_id
  INTO
    v_user_role,
    v_user_empresa_id
  FROM profiles p
  WHERE p.id = auth.uid();

  -- LÓGICA CONDICIONAL BASEADA NA ROLE
  IF v_user_role = 'corretora' THEN
    -- Se for corretora, retorna conversas de TODAS as empresas vinculadas a ela
    RETURN QUERY
    SELECT c.id, e.nome, c.created_at, c.protocolo
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = auth.uid()
    ORDER BY c.created_at DESC;

  ELSE
    -- Se for qualquer outra role (ex: empresa), retorna apenas as suas conversas
    RETURN QUERY
    SELECT c.id, e.nome, c.created_at, c.protocolo
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.empresa_id = v_user_empresa_id
    ORDER BY c.created_at DESC;
  END IF;
END;
$$;
