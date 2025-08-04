
-- Função para buscar métricas financeiras do corretor
CREATE OR REPLACE FUNCTION get_pulse_financeiro_corretor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_receita_mes numeric := 0;
    v_receita_mes_anterior numeric := 0;
    v_comissao_estimada numeric := 0;
    v_margem_risco numeric := 0;
    v_oportunidades numeric := 0;
    v_crescimento_percentual numeric := 0;
BEGIN
    -- Receita do mês atual
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE);

    -- Receita do mês anterior
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes_anterior
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');

    -- Comissão estimada (5% da receita total)
    SELECT COALESCE(SUM(dp.valor_mensal * 0.05), 0) INTO v_comissao_estimada
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo';

    -- Margem de risco (funcionários ativos vs total)
    SELECT CASE 
        WHEN COUNT(f.id) > 0 THEN 
            (COUNT(CASE WHEN f.status = 'ativo' THEN 1 END)::numeric / COUNT(f.id)::numeric) * 100
        ELSE 100
    END INTO v_margem_risco
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id;

    -- Oportunidades (CNPJs sem plano)
    SELECT COUNT(c.id) * 500 INTO v_oportunidades
    FROM cnpjs c
    INNER JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.id IS NULL;

    -- Calcular crescimento percentual
    IF v_receita_mes_anterior > 0 THEN
        v_crescimento_percentual := ((v_receita_mes - v_receita_mes_anterior) / v_receita_mes_anterior) * 100;
    ELSE
        v_crescimento_percentual := 0;
    END IF;

    RETURN jsonb_build_object(
        'receita_mes', v_receita_mes,
        'crescimento_percentual', v_crescimento_percentual,
        'comissao_estimada', v_comissao_estimada,
        'margem_risco', v_margem_risco,
        'oportunidades', v_oportunidades
    );
END;
$$;

-- Função para buscar ações inteligentes
CREATE OR REPLACE FUNCTION get_smart_actions_corretor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'aprovacoes_rapidas', COUNT(CASE WHEN f.status = 'exclusao_solicitada' THEN 1 END),
        'ativacoes_pendentes', COUNT(CASE WHEN f.status = 'pendente' THEN 1 END),
        'cnpjs_sem_plano', COUNT(CASE WHEN dp.id IS NULL AND c.status = 'ativo' THEN 1 END),
        'funcionarios_travados', COUNT(CASE WHEN f.status = 'pendente' AND f.created_at < NOW() - INTERVAL '5 days' THEN 1 END)
    ) INTO v_result
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id;

    RETURN v_result;
END;
$$;

-- Função para buscar top empresas por receita
CREATE OR REPLACE FUNCTION get_top_empresas_receita()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', e.id,
            'nome', e.nome,
            'receita_mensal', COALESCE(SUM(dp.valor_mensal), 0),
            'funcionarios_ativos', COUNT(CASE WHEN f.status = 'ativo' THEN 1 END),
            'pendencias', COUNT(CASE WHEN f.status IN ('pendente', 'exclusao_solicitada') THEN 1 END)
        )
    ) INTO v_result
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id
    GROUP BY e.id, e.nome
    ORDER BY COALESCE(SUM(dp.valor_mensal), 0) DESC
    LIMIT 5;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_pulse_financeiro_corretor() TO authenticated;
GRANT EXECUTE ON FUNCTION get_smart_actions_corretor() TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_empresas_receita() TO authenticated;
