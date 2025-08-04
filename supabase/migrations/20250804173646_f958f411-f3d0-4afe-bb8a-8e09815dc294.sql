
-- Função RPC para buscar conversas do usuário autenticado
CREATE OR REPLACE FUNCTION get_conversas_usuario()
RETURNS TABLE(
  conversa_id uuid,
  empresa_nome text,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_user_role text;
BEGIN
  -- Verificar se o usuário está autenticado
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Buscar o role do usuário
  SELECT role INTO v_user_role
  FROM profiles
  WHERE id = v_user_id;

  -- Se for corretora, buscar conversas onde ele é o corretora_id
  IF v_user_role = 'corretora' THEN
    RETURN QUERY
    SELECT 
      c.id as conversa_id,
      e.nome as empresa_nome,
      c.created_at
    FROM conversas c
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE c.corretora_id = v_user_id
    ORDER BY c.created_at DESC;
  
  -- Se for empresa, buscar conversas onde a empresa_id corresponde à empresa do usuário
  ELSIF v_user_role = 'empresa' THEN
    RETURN QUERY
    SELECT 
      c.id as conversa_id,
      e.nome as empresa_nome,
      c.created_at
    FROM conversas c
    INNER JOIN empresas e ON c.empresa_id = e.id
    INNER JOIN profiles p ON p.empresa_id = e.id
    WHERE p.id = v_user_id
    ORDER BY c.created_at DESC;
  END IF;

  RETURN;
END;
$$;
