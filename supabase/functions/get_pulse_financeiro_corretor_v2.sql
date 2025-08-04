
CREATE OR REPLACE FUNCTION public.get_pulse_financeiro_corretor()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_receita_mes numeric := 0;
    v_receita_mes_anterior numeric := 0;
    v_comissao_estimada numeric := 0;
    v_comissao_vida numeric := 0;
    v_comissao_outros numeric := 0;
    v_margem_risco numeric := 0;
    v_oportunidades numeric := 0;
    v_crescimento_percentual numeric := 0;
BEGIN
    -- Receita mensal TOTAL (todos os planos ativos - não apenas os criados este mês)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo';

    -- Receita do mês anterior (apenas seguros de vida criados no mês anterior para comparação)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes_anterior
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro = 'vida'
    AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');

    -- Comissão estimada para seguros de vida (20%)
    SELECT COALESCE(SUM(dp.valor_mensal * 0.20), 0) INTO v_comissao_vida
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro = 'vida';

    -- Comissão estimada para outros tipos de seguro (5%)
    SELECT COALESCE(SUM(dp.valor_mensal * 0.05), 0) INTO v_comissao_outros
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro != 'vida';

    -- Comissão total
    v_comissao_estimada := v_comissao_vida + v_comissao_outros;

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

    -- Oportunidades (CNPJs sem plano de seguro de vida)
    SELECT COUNT(c.id) * 500 INTO v_oportunidades
    FROM cnpjs c
    INNER JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON (dp.cnpj_id = c.id AND dp.tipo_seguro = 'vida')
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.id IS NULL;

    -- Calcular crescimento percentual baseado na receita de seguros de vida criados este mês vs mês anterior
    IF v_receita_mes_anterior > 0 THEN
        -- Receita de seguros de vida criados este mês
        SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = v_corretora_id
        AND c.status = 'ativo'
        AND dp.tipo_seguro = 'vida'
        AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE);
        
        v_crescimento_percentual := ((v_receita_mes - v_receita_mes_anterior) / v_receita_mes_anterior) * 100;
    ELSE
        v_crescimento_percentual := 0;
    END IF;

    -- Recalcular receita total para o retorno
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo';

    RETURN jsonb_build_object(
        'receita_mes', v_receita_mes,
        'crescimento_percentual', v_crescimento_percentual,
        'comissao_estimada', v_comissao_estimada,
        'margem_risco', v_margem_risco,
        'oportunidades', v_oportunidades
    );
END;
$function$;
