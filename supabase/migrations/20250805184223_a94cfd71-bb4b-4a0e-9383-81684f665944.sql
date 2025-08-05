
-- Criar a função get_conversas_usuario que retorna conversas com contador de mensagens não lidas
CREATE OR REPLACE FUNCTION public.get_conversas_usuario()
RETURNS TABLE(
    conversa_id uuid,
    empresa_nome text,
    created_at timestamp with time zone,
    protocolo text,
    nao_lidas bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_user_role text;
    v_empresa_id uuid;
BEGIN
    -- Obter ID e role do usuário atual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Buscar role e empresa_id do usuário
    SELECT p.role, p.empresa_id 
    INTO v_user_role, v_empresa_id
    FROM profiles p 
    WHERE p.id = v_user_id;
    
    IF v_user_role = 'corretora' THEN
        -- Para corretoras: mostrar conversas de todas as suas empresas
        RETURN QUERY
        SELECT 
            c.id as conversa_id,
            e.nome as empresa_nome,
            c.created_at,
            c.protocolo,
            COUNT(m.id) FILTER (
                WHERE m.remetente_tipo = 'empresa' 
                AND NOT COALESCE(m.lida_corretora, false)
            ) as nao_lidas
        FROM conversas c
        JOIN empresas e ON c.empresa_id = e.id
        LEFT JOIN mensagens m ON m.conversa_id = c.id
        WHERE c.corretora_id = v_user_id
        GROUP BY c.id, e.nome, c.created_at, c.protocolo
        ORDER BY c.created_at DESC;
        
    ELSIF v_user_role = 'empresa' AND v_empresa_id IS NOT NULL THEN
        -- Para empresas: mostrar apenas suas conversas
        RETURN QUERY
        SELECT 
            c.id as conversa_id,
            e.nome as empresa_nome,
            c.created_at,
            c.protocolo,
            COUNT(m.id) FILTER (
                WHERE m.remetente_tipo = 'corretora' 
                AND NOT COALESCE(m.lida_empresa, false)
            ) as nao_lidas
        FROM conversas c
        JOIN empresas e ON c.empresa_id = e.id
        LEFT JOIN mensagens m ON m.conversa_id = c.id
        WHERE c.empresa_id = v_empresa_id
        GROUP BY c.id, e.nome, c.created_at, c.protocolo
        ORDER BY c.created_at DESC;
    END IF;
    
    RETURN;
END;
$$;
