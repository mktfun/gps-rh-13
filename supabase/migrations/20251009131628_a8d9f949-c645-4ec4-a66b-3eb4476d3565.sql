-- Atualizar função ativar_funcionario_no_plano para também atualizar status global do funcionário
CREATE OR REPLACE FUNCTION public.ativar_funcionario_no_plano(p_funcionario_id uuid, p_plano_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_pendencia_id UUID;
BEGIN
    BEGIN
        -- 1. Resolver pendência de ativação para o plano correspondente (se existir)
        UPDATE public.pendencias
        SET status = 'resolvida'
        WHERE funcionario_id = p_funcionario_id
          AND tipo = 'ativacao'
          AND status = 'pendente'
          AND tipo_plano = (SELECT tipo_seguro::text FROM dados_planos WHERE id = p_plano_id)
        RETURNING id INTO v_pendencia_id;

        -- 2. Garantir vínculo no plano
        INSERT INTO public.planos_funcionarios (plano_id, funcionario_id, status)
        VALUES (p_plano_id, p_funcionario_id, 'ativo')
        ON CONFLICT (plano_id, funcionario_id) DO UPDATE
          SET status = EXCLUDED.status;

        -- 3. Atualizar status global do funcionário para ativo
        UPDATE public.funcionarios
        SET status = 'ativo',
            updated_at = NOW()
        WHERE id = p_funcionario_id
          AND status IN ('pendente', 'inativo', 'exclusao_solicitada');

    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'Erro ao ativar funcionário: %', SQLERRM;
    END;

    RETURN jsonb_build_object('success', TRUE, 'message', 'Funcionário ativado com sucesso.');
END;
$function$;