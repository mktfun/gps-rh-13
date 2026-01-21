-- Corrigir comparação de tipos na função ativar_funcionario_no_plano
-- Problema: tipo_plano (enum) não pode ser comparado diretamente com text
-- Solução: converter ambos os lados para text

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
        SET status = 'resolvida',
            updated_at = NOW()
        WHERE funcionario_id = p_funcionario_id
          AND tipo = 'ativacao'
          AND status = 'pendente'
          AND tipo_plano::text = (SELECT tipo_seguro::text FROM dados_planos WHERE id = p_plano_id);
        
        -- Captura o ID da pendência atualizada (se houver)
        GET DIAGNOSTICS v_pendencia_id = ROW_COUNT;

        -- 2. Garantir vínculo no plano
        INSERT INTO public.planos_funcionarios (plano_id, funcionario_id, status)
        VALUES (p_plano_id, p_funcionario_id, 'ativo')
        ON CONFLICT (plano_id, funcionario_id) DO UPDATE
          SET status = 'ativo';

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