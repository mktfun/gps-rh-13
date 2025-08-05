
-- Criar a função RPC para contar total de mensagens não lidas
CREATE OR REPLACE FUNCTION public.contar_total_mensagens_nao_lidas()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id uuid;
    v_total_count integer;
BEGIN
    -- Obter ID do usuário atual
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Contar mensagens não lidas do usuário
    SELECT COUNT(*)::integer
    INTO v_total_count
    FROM mensagens m
    JOIN conversas c ON m.conversa_id = c.id
    WHERE (
        -- Se for corretora, contar mensagens de empresas não lidas por ela
        (c.corretora_id = v_user_id AND m.remetente_tipo = 'empresa' AND NOT m.lida_corretora)
        OR
        -- Se for empresa, contar mensagens de corretoras não lidas por ela  
        (c.empresa_id IN (
            SELECT id FROM empresas WHERE corretora_id = v_user_id OR id = (
                SELECT empresa_id FROM profiles WHERE id = v_user_id
            )
        ) AND m.remetente_tipo = 'corretora' AND NOT m.lida_empresa)
    );
    
    RETURN COALESCE(v_total_count, 0);
END;
$$;
