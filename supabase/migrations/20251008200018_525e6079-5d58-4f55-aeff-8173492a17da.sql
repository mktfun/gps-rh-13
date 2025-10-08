-- Função que executa a lógica de ativação de forma atômica (tudo ou nada)
CREATE OR REPLACE FUNCTION public.ativar_funcionario_no_plano(
    p_funcionario_id UUID,
    p_plano_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
-- DEFINER porque precisa de permissão pra escrever em múltiplas tabelas,
-- mas a lógica interna garante a segurança.
SECURITY DEFINER AS $$
DECLARE
    v_pendencia_id UUID;
BEGIN
    -- Inicia uma transação
    BEGIN
        -- 1. Encontra e atualiza a pendência para 'resolvida'
        UPDATE public.pendencias
        SET status = 'resolvida'
        WHERE funcionario_id = p_funcionario_id
          AND tipo = 'ativacao'
          AND status = 'pendente'
          -- Garante que estamos atualizando a pendência do plano certo
          AND tipo_plano = (SELECT tipo_seguro::text FROM dados_planos WHERE id = p_plano_id)
        RETURNING id INTO v_pendencia_id;

        -- Se não achou nenhuma pendência, dá erro.
        IF v_pendencia_id IS NULL THEN
            RAISE EXCEPTION 'Nenhuma pendência de ativação encontrada para este funcionário e plano.';
        END IF;

        -- 2. Insere o novo vínculo na tabela planos_funcionarios
        INSERT INTO public.planos_funcionarios (plano_id, funcionario_id, status)
        VALUES (p_plano_id, p_funcionario_id, 'ativo')
        ON CONFLICT (plano_id, funcionario_id) DO NOTHING; -- Se já existir, não faz nada

    EXCEPTION
        -- Se qualquer passo der merda, desfaz tudo
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao ativar funcionário: %', SQLERRM;
    END;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Funcionário ativado com sucesso.');
END;
$$;