
-- Passo 1: Corrigir a RLS da tabela mensagens
-- Remover a política restritiva atual e criar uma que permite participantes da conversa verem as mensagens
DROP POLICY IF EXISTS "Participantes podem ver TODAS as mensagens de suas conversas" ON public.mensagens;

CREATE POLICY "Participantes podem ler as mensagens da conversa"
ON public.mensagens FOR SELECT
USING (
  -- Verifica se o usuário logado faz parte da conversa
  EXISTS (
    SELECT 1
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.id = mensagens.conversa_id -- A mensagem pertence a esta conversa
      AND (
        -- E o usuário logado é o da empresa da conversa
        c.empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
        OR
        -- OU o usuário logado é a corretora dona da empresa da conversa
        e.corretora_id = auth.uid()
      )
  )
);

-- Passo 2: Enriquecer a RPC get_conversas_usuario com o protocolo
CREATE OR REPLACE FUNCTION public.get_conversas_usuario()
RETURNS TABLE (
  conversa_id UUID,
  empresa_nome TEXT,
  created_at TIMESTAMPTZ,
  protocolo TEXT -- CAMPO NOVO AQUI
)
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
    RAISE NOTICE 'Executando como corretora: %', auth.uid();
    RETURN QUERY
    SELECT c.id, e.nome, c.created_at, c.protocolo -- MUDANÇA AQUI
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = auth.uid()
    ORDER BY c.created_at DESC;

  ELSE
    -- Se for qualquer outra role (ex: empresa), retorna apenas as suas conversas
    RAISE NOTICE 'Executando como empresa: %', v_user_empresa_id;
    RETURN QUERY
    SELECT c.id, e.nome, c.created_at, c.protocolo -- MUDANÇA AQUI
    FROM public.conversas c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE c.empresa_id = v_user_empresa_id
    ORDER BY c.created_at DESC;
  END IF;
END;
$$;
