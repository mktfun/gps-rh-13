
-- Corrigir a função get_detailed_costs_report para eliminar duplicações
CREATE OR REPLACE FUNCTION public.get_detailed_costs_report(
    p_empresa_id uuid, 
    p_start_date date, 
    p_end_date date
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    WITH relevant_cnpjs AS (
        SELECT DISTINCT c.id, c.razao_social 
        FROM public.cnpjs c
        WHERE c.empresa_id = p_empresa_id 
        AND c.status = 'ativo'
    ),
    relevant_plans AS (
        SELECT DISTINCT dp.id, dp.cnpj_id, dp.seguradora, dp.valor_mensal, dp.tipo_seguro, dp.created_at
        FROM public.dados_planos dp
        INNER JOIN relevant_cnpjs rc ON dp.cnpj_id = rc.id
        WHERE dp.created_at <= p_end_date
    ),
    kpis AS (
        SELECT
            -- CORREÇÃO: Somar apenas os valores dos planos (valor fixo por plano)
            COALESCE(SUM(DISTINCT rp.valor_mensal), 0) AS custo_total_periodo,
            COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo') AS total_funcionarios_ativos,
            CASE
                WHEN COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo') > 0 THEN 
                    COALESCE(SUM(DISTINCT rp.valor_mensal), 0) / COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo')
                ELSE 0
            END AS custo_medio_funcionario,
            0 AS variacao_percentual -- Simplificar por enquanto
        FROM relevant_plans rp
        LEFT JOIN public.funcionarios f ON f.cnpj_id = rp.cnpj_id
    ),
    evolucao_temporal AS (
        SELECT
            json_agg(
                json_build_object(
                    'mes', to_char(month_series.month, 'YYYY-MM'),
                    'mes_nome', to_char(month_series.month, 'TMMonth YYYY'),
                    'custo_total', COALESCE(monthly_costs.total_cost, 0)
                )
                ORDER BY month_series.month
            ) AS evolucao
        FROM (
            SELECT generate_series(
                date_trunc('month', p_start_date::date), 
                date_trunc('month', p_end_date::date), 
                '1 month'::interval
            )::date AS month
        ) month_series
        LEFT JOIN (
            SELECT 
                date_trunc('month', rp.created_at)::date AS month,
                SUM(DISTINCT rp.valor_mensal) AS total_cost
            FROM relevant_plans rp
            WHERE rp.created_at >= date_trunc('month', p_start_date::date)
            AND rp.created_at <= p_end_date
            GROUP BY date_trunc('month', rp.created_at)::date
        ) monthly_costs ON month_series.month = monthly_costs.month
    ),
    distribuicao_cnpjs AS (
        SELECT
            json_agg(
                json_build_object(
                    'cnpj', rc.id::text,
                    'razao_social', rc.razao_social,
                    'valor_mensal', COALESCE(rp.valor_mensal, 0),
                    'funcionarios_ativos', COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo'),
                    'custo_por_funcionario', CASE 
                        WHEN COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo') > 0 
                        THEN COALESCE(rp.valor_mensal, 0) / COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo')
                        ELSE 0 
                    END,
                    'percentual_total', CASE 
                        WHEN kpis.custo_total_periodo > 0 
                        THEN (COALESCE(rp.valor_mensal, 0) / kpis.custo_total_periodo) * 100
                        ELSE 0
                    END
                )
            ) AS distribuicao
        FROM relevant_cnpjs rc
        LEFT JOIN relevant_plans rp ON rp.cnpj_id = rc.id
        LEFT JOIN public.funcionarios f ON f.cnpj_id = rc.id
        CROSS JOIN kpis
        GROUP BY rc.id, rc.razao_social, rp.valor_mensal, kpis.custo_total_periodo
    ),
    tabela_detalhada AS (
        SELECT
            json_agg(
                json_build_object(
                    'cnpj_id', rc.id::text,
                    'cnpj', c_full.cnpj,
                    'razao_social', rc.razao_social,
                    'seguradora', COALESCE(rp.seguradora, 'Não informado'),
                    'valor_mensal', COALESCE(rp.valor_mensal, 0),
                    'funcionarios_ativos', COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo'),
                    'custo_por_funcionario', CASE 
                        WHEN COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo') > 0 
                        THEN COALESCE(rp.valor_mensal, 0) / COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo')
                        ELSE 0 
                    END,
                    'data_inicio_plano', COALESCE(rp.created_at::date, CURRENT_DATE),
                    'tipo_seguro', COALESCE(rp.tipo_seguro::text, 'vida')
                )
            ) AS tabela
        FROM relevant_cnpjs rc
        LEFT JOIN relevant_plans rp ON rp.cnpj_id = rc.id
        LEFT JOIN public.funcionarios f ON f.cnpj_id = rc.id
        LEFT JOIN public.cnpjs c_full ON c_full.id = rc.id
        GROUP BY rc.id, rc.razao_social, rp.seguradora, rp.valor_mensal, rp.created_at, rp.tipo_seguro, c_full.cnpj
    )
    SELECT json_build_object(
        'kpis', json_build_object(
            'custo_total_periodo', kpis.custo_total_periodo,
            'custo_medio_funcionario', kpis.custo_medio_funcionario,
            'variacao_percentual', kpis.variacao_percentual,
            'total_funcionarios_ativos', kpis.total_funcionarios_ativos
        ),
        'evolucao_temporal', COALESCE(et.evolucao, '[]'::json),
        'distribuicao_cnpjs', COALESCE(dc.distribuicao, '[]'::json),
        'tabela_detalhada', COALESCE(td.tabela, '[]'::json),
        'periodo', json_build_object(
            'inicio', p_start_date::text,
            'fim', p_end_date::text
        )
    ) INTO result
    FROM kpis
    CROSS JOIN evolucao_temporal et
    CROSS JOIN distribuicao_cnpjs dc  
    CROSS JOIN tabela_detalhada td;

    RETURN result;
END;
$$;
