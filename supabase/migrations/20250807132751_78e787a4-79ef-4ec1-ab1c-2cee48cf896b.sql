
-- Criar função para relatório detalhado de custos com filtros temporais
CREATE OR REPLACE FUNCTION get_detailed_costs_report(
    p_empresa_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    custo_total_periodo numeric := 0;
    custo_medio_funcionario numeric := 0;
    variacao_percentual numeric := 0;
    custo_periodo_anterior numeric := 0;
    total_funcionarios_ativos integer := 0;
    evolucao_temporal json;
    distribuicao_cnpjs json;
    tabela_detalhada json;
    periodo_anterior_start date;
    periodo_anterior_end date;
BEGIN
    -- Calcular período anterior para comparação
    SELECT 
        p_start_date - (p_end_date - p_start_date + 1),
        p_start_date - 1
    INTO periodo_anterior_start, periodo_anterior_end;

    -- Custo total no período selecionado
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_total_periodo
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    AND dp.created_at <= p_end_date
    AND (dp.updated_at IS NULL OR dp.updated_at >= p_start_date);

    -- Total de funcionários ativos para cálculo do custo médio
    SELECT COUNT(*) INTO total_funcionarios_ativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'ativo';

    -- Custo médio por funcionário
    IF total_funcionarios_ativos > 0 THEN
        custo_medio_funcionario := custo_total_periodo / total_funcionarios_ativos;
    END IF;

    -- Custo do período anterior para calcular variação
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_periodo_anterior
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    AND dp.created_at <= periodo_anterior_end
    AND (dp.updated_at IS NULL OR dp.updated_at >= periodo_anterior_start);

    -- Calcular variação percentual
    IF custo_periodo_anterior > 0 THEN
        variacao_percentual := ((custo_total_periodo - custo_periodo_anterior) / custo_periodo_anterior) * 100;
    ELSE
        variacao_percentual := 0;
    END IF;

    -- Evolução temporal mensal
    WITH meses_periodo AS (
        SELECT generate_series(
            DATE_TRUNC('month', p_start_date),
            DATE_TRUNC('month', p_end_date),
            INTERVAL '1 month'
        )::date as mes
    )
    SELECT json_agg(
        json_build_object(
            'mes', TO_CHAR(mp.mes, 'YYYY-MM'),
            'mes_nome', TO_CHAR(mp.mes, 'Mon YYYY'),
            'custo_total', COALESCE(SUM(dp.valor_mensal), 0)
        ) ORDER BY mp.mes
    ) INTO evolucao_temporal
    FROM meses_periodo mp
    LEFT JOIN cnpjs c ON c.empresa_id = p_empresa_id AND c.status = 'ativo'
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id 
        AND DATE_TRUNC('month', dp.created_at) <= mp.mes
        AND (dp.updated_at IS NULL OR DATE_TRUNC('month', dp.updated_at) >= mp.mes);

    -- Distribuição de custos por CNPJ
    SELECT json_agg(
        json_build_object(
            'cnpj', sub.cnpj,
            'razao_social', sub.razao_social,
            'valor_mensal', sub.valor_mensal,
            'funcionarios_ativos', sub.funcionarios_ativos,
            'custo_por_funcionario', sub.custo_por_funcionario,
            'percentual_total', sub.percentual_total
        )
    ) INTO distribuicao_cnpjs
    FROM (
        SELECT 
            c.cnpj,
            c.razao_social,
            COALESCE(dp.valor_mensal, 0) as valor_mensal,
            COUNT(f.id) as funcionarios_ativos,
            CASE 
                WHEN COUNT(f.id) > 0 THEN COALESCE(dp.valor_mensal, 0) / COUNT(f.id)
                ELSE 0 
            END as custo_por_funcionario,
            CASE 
                WHEN custo_total_periodo > 0 THEN (COALESCE(dp.valor_mensal, 0) / custo_total_periodo) * 100
                ELSE 0 
            END as percentual_total
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
        WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
        GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
        HAVING COALESCE(dp.valor_mensal, 0) > 0
        ORDER BY dp.valor_mensal DESC
    ) sub;

    -- Tabela detalhada
    SELECT json_agg(
        json_build_object(
            'cnpj_id', c.id,
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'seguradora', dp.seguradora,
            'valor_mensal', dp.valor_mensal,
            'funcionarios_ativos', COUNT(f.id),
            'custo_por_funcionario', 
                CASE 
                    WHEN COUNT(f.id) > 0 THEN dp.valor_mensal / COUNT(f.id)
                    ELSE 0 
                END,
            'data_inicio_plano', dp.created_at::date,
            'tipo_seguro', dp.tipo_seguro
        )
    ) INTO tabela_detalhada
    FROM cnpjs c
    INNER JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    AND dp.created_at <= p_end_date
    GROUP BY c.id, c.cnpj, c.razao_social, dp.id, dp.seguradora, dp.valor_mensal, dp.created_at, dp.tipo_seguro
    ORDER BY dp.valor_mensal DESC;

    -- Retornar resultado consolidado
    RETURN json_build_object(
        'kpis', json_build_object(
            'custo_total_periodo', custo_total_periodo,
            'custo_medio_funcionario', custo_medio_funcionario,
            'variacao_percentual', variacao_percentual,
            'total_funcionarios_ativos', total_funcionarios_ativos
        ),
        'evolucao_temporal', COALESCE(evolucao_temporal, '[]'::json),
        'distribuicao_cnpjs', COALESCE(distribuicao_cnpjs, '[]'::json),
        'tabela_detalhada', COALESCE(tabela_detalhada, '[]'::json),
        'periodo', json_build_object(
            'inicio', p_start_date,
            'fim', p_end_date
        )
    );
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_detailed_costs_report(uuid, date, date) TO authenticated;
