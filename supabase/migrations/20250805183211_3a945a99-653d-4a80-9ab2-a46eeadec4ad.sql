
-- Atualizar a função get_conversas_usuario para incluir contagem de não lidas
CREATE OR REPLACE FUNCTION public.get_conversas_usuario()
RETURNS TABLE (
  conversa_id UUID,
  empresa_nome TEXT,
  created_at TIMESTAMPTZ,
  protocolo TEXT,
  nao_lidas BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Obter role do usuário
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    
    IF user_role = 'corretora' THEN
        RETURN QUERY
        SELECT
            c.id as conversa_id,
            e.nome as empresa_nome,
            c.created_at,
            c.protocolo,
            COALESCE((SELECT COUNT(*) FROM public.mensagens m WHERE m.conversa_id = c.id AND m.lida = false AND m.remetente_id != auth.uid()), 0)::BIGINT as nao_lidas
        FROM
            public.conversas c
        JOIN public.empresas e ON c.empresa_id = e.id
        WHERE
            e.corretora_id = auth.uid()
        ORDER BY c.created_at DESC;
    ELSE
        RETURN QUERY
        SELECT
            c.id as conversa_id,
            COALESCE((SELECT nome FROM profiles WHERE id = c.corretora_id), 'Corretora') as empresa_nome,
            c.created_at,
            c.protocolo,
            COALESCE((SELECT COUNT(*) FROM public.mensagens m WHERE m.conversa_id = c.id AND m.lida = false AND m.remetente_id != auth.uid()), 0)::BIGINT as nao_lidas
        FROM
            public.conversas c
        JOIN public.empresas e ON c.empresa_id = e.id
        JOIN public.profiles p ON p.empresa_id = e.id
        WHERE
            p.id = auth.uid()
        ORDER BY c.created_at DESC;
    END IF;
END;
$$;

-- Criar função para contar total de mensagens não lidas
CREATE OR REPLACE FUNCTION public.contar_total_mensagens_nao_lidas()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_role TEXT;
    total_count INT := 0;
BEGIN
    -- Obter role do usuário
    SELECT role INTO user_role FROM profiles WHERE id = auth.uid();
    
    IF user_role = 'corretora' THEN
        SELECT COUNT(*)::INT INTO total_count
        FROM public.mensagens m
        JOIN public.conversas c ON m.conversa_id = c.id
        JOIN public.empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = auth.uid()
          AND m.lida = false
          AND m.remetente_id != auth.uid();
    ELSE
        SELECT COUNT(*)::INT INTO total_count
        FROM public.mensagens m
        JOIN public.conversas c ON m.conversa_id = c.id
        JOIN public.empresas e ON c.empresa_id = e.id
        JOIN public.profiles p ON p.empresa_id = e.id
        WHERE p.id = auth.uid()
          AND m.lida = false
          AND m.remetente_id != auth.uid();
    END IF;
    
    RETURN total_count;
END;
$$;

-- Criar função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION public.marcar_mensagens_como_lidas(p_conversa_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.mensagens 
    SET 
        lida = true,
        lida_em = NOW()
    WHERE conversa_id = p_conversa_id 
      AND remetente_id != auth.uid()
      AND lida = false;
END;
$$;
