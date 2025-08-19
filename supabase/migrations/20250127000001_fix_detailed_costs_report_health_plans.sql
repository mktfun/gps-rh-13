-- Corrigir função get_detailed_costs_report para aplicar a mesma lógica do dashboard
-- Problema: função não aplicava cálculo automático para planos de saúde com valor 0

DROP FUNCTION IF EXISTS public.get_detailed_costs_report(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_detailed_costs_report(
    p_empresa_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
    v_custo_total_periodo numeric := 0;
    v_custo_medio_funcionario numeric := 0;
    v_variacao_percentual numeric := 0;
    v_total_funcionarios_ativos int := 0;
BEGIN
    -- Calcular KPIs principais com lógica corrigida para planos de saúde
    WITH planos_ativos_periodo AS (
        SELECT DISTINCT
            dp.cnpj_id,
            -- Aplicar lógica de cálculo automático para planos de saúde
            CASE 
                WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                    COALESCE((
                        SELECT COUNT(*) * 300.00
                        FROM funcionarios f 
                        WHERE f.cnpj_id = dp.cnpj_id 
                          AND f.status = 'ativo'
                          AND f.created_at::date <= p_end_date
                          AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date)
                    ), 0)
                ELSE COALESCE(dp.valor_mensal, 0)
            END as valor_mensal_calculado,
            c.razao_social
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND dp.created_at::date <= p_end_date
        AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
        AND dp.tipo_seguro IN ('vida', 'saude') -- Incluir explicitamente vida e saúde
    ),
    funcionarios_ativos_periodo AS (
        SELECT COUNT(DISTINCT f.id) as total
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.created_at::date <= p_end_date
        AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date)
        AND f.status IN ('ativo', 'pendente')
    )
    SELECT 
        COALESCE(SUM(pa.valor_mensal_calculado), 0),
        fa.total
    INTO v_custo_total_periodo, v_total_funcionarios_ativos
    FROM planos_ativos_periodo pa
    CROSS JOIN funcionarios_ativos_periodo fa;

    -- Calcular custo médio por funcionário
    IF v_total_funcionarios_ativos > 0 THEN
        v_custo_medio_funcionario := v_custo_total_periodo / v_total_funcionarios_ativos;
    END IF;

    -- Calcular variação percentual (comparar com período anterior)
    DECLARE
        v_periodo_anterior_inicio date := p_start_date - (p_end_date - p_start_date + 1);
        v_periodo_anterior_fim date := p_start_date - 1;
        v_custo_periodo_anterior numeric := 0;
    BEGIN
        WITH planos_periodo_anterior AS (
            SELECT DISTINCT
                dp.cnpj_id,
                CASE 
                    WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                        COALESCE((
                            SELECT COUNT(*) * 300.00
                            FROM funcionarios f 
                            WHERE f.cnpj_id = dp.cnpj_id 
                              AND f.status = 'ativo'
                              AND f.created_at::date <= v_periodo_anterior_fim
                              AND (f.data_exclusao IS NULL OR f.data_exclusao::date > v_periodo_anterior_inicio)
                        ), 0)
                    ELSE COALESCE(dp.valor_mensal, 0)
                END as valor_mensal_calculado
            FROM dados_planos dp
            INNER JOIN cnpjs c ON dp.cnpj_id = c.id
            WHERE c.empresa_id = p_empresa_id
            AND dp.created_at::date <= v_periodo_anterior_fim
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > v_periodo_anterior_inicio))
            AND dp.tipo_seguro IN ('vida', 'saude')
        )
        SELECT COALESCE(SUM(valor_mensal_calculado), 0)
        INTO v_custo_periodo_anterior
        FROM planos_periodo_anterior;

        IF v_custo_periodo_anterior > 0 THEN
            v_variacao_percentual := ((v_custo_total_periodo - v_custo_periodo_anterior) / v_custo_periodo_anterior) * 100;
        END IF;
    END;

    -- Montar resultado completo com lógica corrigida
    WITH evolucao_temporal AS (
        SELECT 
            to_char(mes_data, 'YYYY-MM') as mes,
            to_char(mes_data, 'Mon YYYY') as mes_nome,
            COALESCE(custo_mes.custo_total, 0) as custo_total,
            COALESCE(func_mes.funcionarios, 0) as funcionarios
        FROM (
            SELECT generate_series(
                date_trunc('month', p_start_date), 
                date_trunc('month', p_end_date), 
                '1 month'::interval
            ) as mes_data
        ) meses
        LEFT JOIN (
            SELECT 
                date_trunc('month', mes_ref) as mes,
                SUM(valor_mensal_calculado) as custo_total
            FROM (
                SELECT DISTINCT
                    dp.cnpj_id,
                    CASE 
                        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                            COALESCE((
                                SELECT COUNT(*) * 300.00
                                FROM funcionarios f 
                                WHERE f.cnpj_id = dp.cnpj_id 
                                  AND f.status = 'ativo'
                                  AND f.created_at <= dp.created_at
                            ), 0)
                        ELSE COALESCE(dp.valor_mensal, 0)
                    END as valor_mensal_calculado,
                    generate_series(
                        GREATEST(date_trunc('month', dp.created_at), date_trunc('month', p_start_date::timestamp)),
                        LEAST(
                            CASE 
                                WHEN c.status = 'ativo' THEN date_trunc('month', p_end_date::timestamp)
                                ELSE date_trunc('month', c.updated_at) - interval '1 month'
                            END,
                            date_trunc('month', p_end_date::timestamp)
                        ),
                        '1 month'::interval
                    ) as mes_ref
                FROM dados_planos dp
                INNER JOIN cnpjs c ON dp.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id
                AND dp.created_at::date <= p_end_date
                AND dp.tipo_seguro IN ('vida', 'saude')
            ) planos_por_mes
            GROUP BY date_trunc('month', mes_ref)
        ) custo_mes ON meses.mes_data = custo_mes.mes
        LEFT JOIN (
            SELECT 
                date_trunc('month', mes_ref) as mes,
                COUNT(DISTINCT funcionario_id) as funcionarios
            FROM (
                SELECT 
                    f.id as funcionario_id,
                    generate_series(
                        GREATEST(date_trunc('month', f.created_at), date_trunc('month', p_start_date::timestamp)),
                        LEAST(
                            CASE 
                                WHEN f.data_exclusao IS NULL THEN date_trunc('month', p_end_date::timestamp)
                                ELSE date_trunc('month', f.data_exclusao) - interval '1 month'
                            END,
                            date_trunc('month', p_end_date::timestamp)
                        ),
                        '1 month'::interval
                    ) as mes_ref
                FROM funcionarios f
                INNER JOIN cnpjs c ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id
                AND f.created_at::date <= p_end_date
                AND f.status IN ('ativo', 'pendente')
            ) func_por_mes
            GROUP BY date_trunc('month', mes_ref)
        ) func_mes ON meses.mes_data = func_mes.mes
        ORDER BY mes_data
    ),
    distribuicao_cnpjs AS (
        SELECT 
            c.cnpj,
            c.razao_social,
            CASE 
                WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                    COALESCE((
                        SELECT COUNT(*) * 300.00
                        FROM funcionarios f2 
                        WHERE f2.cnpj_id = c.id 
                          AND f2.status = 'ativo'
                          AND f2.created_at::date <= p_end_date 
                          AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                    ), 0)
                ELSE COALESCE(dp.valor_mensal, 0)
            END as valor_mensal,
            COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) as funcionarios_ativos,
            CASE 
                WHEN COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) > 0
                THEN 
                    (CASE 
                        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                            COALESCE((
                                SELECT COUNT(*) * 300.00
                                FROM funcionarios f2 
                                WHERE f2.cnpj_id = c.id 
                                  AND f2.status = 'ativo'
                                  AND f2.created_at::date <= p_end_date 
                                  AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                            ), 0)
                        ELSE COALESCE(dp.valor_mensal, 0)
                    END) / COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END)
                ELSE 0
            END as custo_por_funcionario,
            CASE 
                WHEN v_custo_total_periodo > 0 
                THEN ROUND(((CASE 
                    WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                        COALESCE((
                            SELECT COUNT(*) * 300.00
                            FROM funcionarios f2 
                            WHERE f2.cnpj_id = c.id 
                              AND f2.status = 'ativo'
                              AND f2.created_at::date <= p_end_date 
                              AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                        ), 0)
                    ELSE COALESCE(dp.valor_mensal, 0)
                END) / v_custo_total_periodo) * 100, 2)
                ELSE 0
            END as percentual_total
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON c.id = dp.cnpj_id 
            AND dp.created_at::date <= p_end_date
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
            AND dp.tipo_seguro IN ('vida', 'saude')
        LEFT JOIN funcionarios f ON c.id = f.cnpj_id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal, dp.tipo_seguro
        HAVING (CASE 
            WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                COALESCE((
                    SELECT COUNT(*) * 300.00
                    FROM funcionarios f2 
                    WHERE f2.cnpj_id = c.id 
                      AND f2.status = 'ativo'
                      AND f2.created_at::date <= p_end_date 
                      AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                ), 0)
            ELSE COALESCE(dp.valor_mensal, 0)
        END) > 0
        ORDER BY c.razao_social
    ),
    tabela_detalhada AS (
        SELECT 
            c.id as cnpj_id,
            c.cnpj,
            c.razao_social,
            COALESCE(dp.seguradora, 'N/A') as seguradora,
            CASE 
                WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                    COALESCE((
                        SELECT COUNT(*) * 300.00
                        FROM funcionarios f2 
                        WHERE f2.cnpj_id = c.id 
                          AND f2.status = 'ativo'
                          AND f2.created_at::date <= p_end_date 
                          AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                    ), 0)
                ELSE COALESCE(dp.valor_mensal, 0)
            END as valor_mensal,
            COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) as funcionarios_ativos,
            CASE 
                WHEN COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) > 0
                THEN 
                    (CASE 
                        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                            COALESCE((
                                SELECT COUNT(*) * 300.00
                                FROM funcionarios f2 
                                WHERE f2.cnpj_id = c.id 
                                  AND f2.status = 'ativo'
                                  AND f2.created_at::date <= p_end_date 
                                  AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                            ), 0)
                        ELSE COALESCE(dp.valor_mensal, 0)
                    END) / COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END)
                ELSE 0
            END as custo_por_funcionario,
            COALESCE(dp.created_at::date, c.created_at::date) as data_inicio_plano,
            COALESCE(dp.tipo_seguro::text, 'vida') as tipo_seguro
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON c.id = dp.cnpj_id 
            AND dp.created_at::date <= p_end_date
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
            AND dp.tipo_seguro IN ('vida', 'saude')
        LEFT JOIN funcionarios f ON c.id = f.cnpj_id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY c.id, c.cnpj, c.razao_social, dp.seguradora, dp.valor_mensal, dp.created_at, dp.tipo_seguro
        HAVING (CASE 
            WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                COALESCE((
                    SELECT COUNT(*) * 300.00
                    FROM funcionarios f2 
                    WHERE f2.cnpj_id = c.id 
                      AND f2.status = 'ativo'
                      AND f2.created_at::date <= p_end_date 
                      AND (f2.data_exclusao IS NULL OR f2.data_exclusao::date > p_start_date)
                ), 0)
            ELSE COALESCE(dp.valor_mensal, 0)
        END) > 0
        ORDER BY c.razao_social
    )
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'custo_total_periodo', v_custo_total_periodo,
            'custo_medio_funcionario', v_custo_medio_funcionario,
            'variacao_percentual', v_variacao_percentual,
            'total_funcionarios_ativos', v_total_funcionarios_ativos
        ),
        'evolucao_temporal', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'mes', et.mes,
                    'mes_nome', et.mes_nome,
                    'custo_total', et.custo_total,
                    'funcionarios', et.funcionarios
                )
                ORDER BY et.mes
            )
            FROM evolucao_temporal et
        ), '[]'::jsonb),
        'distribuicao_cnpjs', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cnpj', dc.cnpj,
                    'razao_social', dc.razao_social,
                    'valor_mensal', dc.valor_mensal,
                    'funcionarios_ativos', dc.funcionarios_ativos,
                    'custo_por_funcionario', dc.custo_por_funcionario,
                    'percentual_total', dc.percentual_total
                )
            )
            FROM distribuicao_cnpjs dc
        ), '[]'::jsonb),
        'tabela_detalhada', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cnpj_id', td.cnpj_id,
                    'cnpj', td.cnpj,
                    'razao_social', td.razao_social,
                    'seguradora', td.seguradora,
                    'valor_mensal', td.valor_mensal,
                    'funcionarios_ativos', td.funcionarios_ativos,
                    'custo_por_funcionario', td.custo_por_funcionario,
                    'data_inicio_plano', td.data_inicio_plano,
                    'tipo_seguro', td.tipo_seguro
                )
            )
            FROM tabela_detalhada td
        ), '[]'::jsonb),
        'periodo', jsonb_build_object(
            'inicio', p_start_date,
            'fim', p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_detailed_costs_report(uuid, date, date) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_detailed_costs_report(uuid, date, date) IS 
'Retorna relatório detalhado de custos incluindo cálculo automático para planos de saúde com valor 0. 
Aplica R$ 300 por funcionário ativo para planos de saúde sem valor configurado, mantendo consistência com o dashboard.';
