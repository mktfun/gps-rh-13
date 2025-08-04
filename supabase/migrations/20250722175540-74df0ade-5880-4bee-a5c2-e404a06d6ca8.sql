
CREATE OR REPLACE FUNCTION public.get_acoes_necessarias_corretora()
RETURNS jsonb AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_pendencias_exclusao int;
    v_novos_funcionarios int;
    v_configuracao_pendente int;
BEGIN
    -- Contagem de pendências de exclusão
    SELECT count(f.id)
    INTO v_pendencias_exclusao
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id AND f.status = 'exclusao_solicitada';

    -- Contagem de novos funcionários pendentes de ativação
    SELECT count(f.id)
    INTO v_novos_funcionarios
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id AND f.status = 'pendente';

    -- Contagem de empresas com CNPJs em configuração
    SELECT count(DISTINCT e.id)
    INTO v_configuracao_pendente
    FROM public.empresas e
    JOIN public.cnpjs c ON e.id = c.empresa_id
    WHERE e.corretora_id = v_corretora_id AND c.status = 'configuracao';

    -- Retorna o objeto JSON completo
    RETURN jsonb_build_object(
        'pendencias_exclusao', v_pendencias_exclusao,
        'novos_funcionarios', v_novos_funcionarios,
        'configuracao_pendente', v_configuracao_pendente
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
