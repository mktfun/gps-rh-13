
-- Corrigir função para não inventar dados históricos falsos
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
        SELECT DISTINCT c.id, c.razao_social, c.cnpj
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
    funcionarios_stats AS (
        SELECT 
            f.cnpj_id,
            COUNT(*) FILTER (WHERE f.status = 'ativo') AS funcionarios_ativos_count
        FROM public.funcionarios f
        INNER JOIN relevant_cnpjs rc ON f.cnpj_id = rc.id
        GROUP BY f.cnpj_id
    ),
    planos_base AS (
        SELECT 
            rp.cnpj_id,
            rp.valor_mensal,
            rp.seguradora,
            rp.tipo_seguro,
            rp.created_at,
            COALESCE(fs.funcionarios_ativos_count, 0) AS funcionarios_ativos
        FROM relevant_plans rp
        LEFT JOIN funcionarios_stats fs ON rp.cnpj_id = fs.cnpj_id
    ),
    kpis AS (
        SELECT
            COALESCE(SUM(pb.valor_mensal), 0) AS custo_total_periodo,
            SUM(pb.funcionarios_ativos) AS total_funcionarios_ativos,
            CASE
                WHEN SUM(pb.funcionarios_ativos) > 0 THEN 
                    COALESCE(SUM(pb.valor_mensal), 0) / SUM(pb.funcionarios_ativos)
                ELSE 0
            END AS custo_medio_funcionario,
            0 AS variacao_percentual
        FROM planos_base pb
    ),
    -- CORREÇÃO: Apenas meses onde há planos realmente ativos (não gerar série temporal fictícia)
    monthly_data AS (
        SELECT 
            date_trunc('month', month_with_data.month)::date AS month,
            SUM(pb.valor_mensal) AS total_cost,
            SUM(pb.funcionarios_ativos) AS total_funcionarios
        FROM (
            -- Encontrar todos os meses únicos onde existem planos ativos
            SELECT DISTINCT date_trunc('month', pb.created_at) AS month
            FROM planos_base pb
            WHERE pb.created_at >= p_start_date
            AND pb.created_at <= p_end_date
            UNION
            -- Incluir meses subsequentes até a data final se o plano continua ativo
            SELECT generate_series(
                date_trunc('month', MIN(pb.created_at)), 
                date_trunc('month', p_end_date::date), 
                '1 month'::interval
            )::date
            FROM planos_base pb
            WHERE EXISTS (
                SELECT 1 FROM planos_base pb2 
                WHERE pb2.created_at <= generate_series.generate_series
            )
        ) month_with_data
        INNER JOIN planos_base pb ON date_trunc('month', pb.created_at) <= month_with_data.month
        WHERE month_with_data.month >= date_trunc('month', p_start_date::date)
        AND month_with_data.month <= date_trunc('month', p_end_date::date)
        GROUP BY date_trunc('month', month_with_data.month)::date
    ),
    evolucao_temporal AS (
        SELECT
            CASE 
                WHEN COUNT(*) = 0 THEN '[]'::json
                ELSE json_agg(
                    json_build_object(
                        'mes', to_char(md.month, 'YYYY-MM'),
                        'mes_nome', to_char(md.month, 'TMMonth YYYY'),
                        'custo_total', COALESCE(md.total_cost, 0),
                        'funcionarios', COALESCE(md.total_funcionarios, 0)
                    )
                    ORDER BY md.month
                )
            END AS evolucao
        FROM monthly_data md
    ),
    cnpj_aggregated AS (
        SELECT 
            rc.id,
            rc.razao_social,
            pb.valor_mensal,
            pb.funcionarios_ativos,
            k.custo_total_periodo
        FROM relevant_cnpjs rc
        LEFT JOIN planos_base pb ON pb.cnpj_id = rc.id
        CROSS JOIN kpis k
    ),
    distribuicao_cnpjs AS (
        SELECT
            json_agg(
                json_build_object(
                    'cnpj', ca.id::text,
                    'razao_social', ca.razao_social,
                    'valor_mensal', COALESCE(ca.valor_mensal, 0),
                    'funcionarios_ativos', ca.funcionarios_ativos,
                    'custo_por_funcionario', CASE 
                        WHEN ca.funcionarios_ativos > 0 
                        THEN COALESCE(ca.valor_mensal, 0) / ca.funcionarios_ativos
                        ELSE 0 
                    END,
                    'percentual_total', CASE 
                        WHEN ca.custo_total_periodo > 0 
                        THEN (COALESCE(ca.valor_mensal, 0) / ca.custo_total_periodo) * 100
                        ELSE 0
                    END
                )
            ) AS distribuicao
        FROM cnpj_aggregated ca
        WHERE ca.valor_mensal IS NOT NULL
    ),
    tabela_aggregated AS (
        SELECT 
            rc.id,
            rc.cnpj,
            rc.razao_social,
            pb.seguradora,
            pb.valor_mensal,
            pb.funcionarios_ativos,
            pb.created_at,
            pb.tipo_seguro
        FROM relevant_cnpjs rc
        LEFT JOIN planos_base pb ON pb.cnpj_id = rc.id
        WHERE pb.valor_mensal IS NOT NULL
    ),
    tabela_detalhada AS (
        SELECT
            json_agg(
                json_build_object(
                    'cnpj_id', ta.id::text,
                    'cnpj', ta.cnpj,
                    'razao_social', ta.razao_social,
                    'seguradora', COALESCE(ta.seguradora, 'Não informado'),
                    'valor_mensal', COALESCE(ta.valor_mensal, 0),
                    'funcionarios_ativos', ta.funcionarios_ativos,
                    'custo_por_funcionario', CASE 
                        WHEN ta.funcionarios_ativos > 0 
                        THEN COALESCE(ta.valor_mensal, 0) / ta.funcionarios_ativos
                        ELSE 0 
                    END,
                    'data_inicio_plano', COALESCE(ta.created_at::date, CURRENT_DATE),
                    'tipo_seguro', COALESCE(ta.tipo_seguro::text, 'vida')
                )
            ) AS tabela
        FROM tabela_aggregated ta
    )
    SELECT json_build_object(
        'kpis', json_build_object(
            'custo_total_periodo', k.custo_total_periodo,
            'custo_medio_funcionario', k.custo_medio_funcionario,
            'variacao_percentual', k.variacao_percentual,
            'total_funcionarios_ativos', k.total_funcionarios_ativos
        ),
        'evolucao_temporal', COALESCE(et.evolucao, '[]'::json),
        'distribuicao_cnpjs', COALESCE(dc.distribuicao, '[]'::json),
        'tabela_detalhada', COALESCE(td.tabela, '[]'::json),
        'periodo', json_build_object(
            'inicio', p_start_date::text,
            'fim', p_end_date::text
        )
    ) INTO result
    FROM kpis k
    CROSS JOIN evolucao_temporal et
    CROSS JOIN distribuicao_cnpjs dc  
    CROSS JOIN tabela_detalhada td;

    RETURN result;
END;
$$;
