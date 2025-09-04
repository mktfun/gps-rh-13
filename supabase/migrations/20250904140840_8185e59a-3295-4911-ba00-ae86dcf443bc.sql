CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics(p_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_custo_total_mensal numeric;
    v_result json;
BEGIN
    -- LÓGICA DE CÁLCULO FINAL E CORRETA
    SELECT
        COALESCE(SUM(
            CASE
                -- Para seguro de vida, o custo é o valor fixo do plano
                WHEN dp.tipo_seguro = 'vida' THEN dp.valor_mensal
                
                -- Para seguro de saúde, o custo é o valor do plano MULTIPLICADO pelos funcionários ativos
                WHEN dp.tipo_seguro = 'saude' THEN dp.valor_mensal * (
                    SELECT COUNT(*)
                    FROM funcionarios f
                    WHERE f.cnpj_id = dp.cnpj_id AND f.status = 'ativo'
                )
                
                -- Para outros tipos, assumimos custo fixo por padrão
                ELSE dp.valor_mensal
            END
        ), 0)
    INTO
        v_custo_total_mensal
    FROM dados_planos AS dp
    JOIN cnpjs AS c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id;

    -- Monta o objeto JSON de retorno com o cálculo correto
    SELECT json_build_object(
        'total_cnpjs', (SELECT COUNT(*) FROM cnpjs WHERE empresa_id = p_empresa_id AND status = 'ativo'),
        'total_funcionarios', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id),
        'funcionarios_ativos', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo'),
        'funcionarios_pendentes', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'pendente'),
        'custo_mensal_total', v_custo_total_mensal
    )
    INTO v_result;

    RETURN v_result;
END;
$$;