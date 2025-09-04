CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics(p_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result json;
    v_custo_mensal_total numeric;
BEGIN
    -- LÓGICA DE CÁLCULO RESTAURADA E CORRIGIDA (SEGUNDO SEU PLANO)
    -- Simplesmente soma o valor de cada plano ativo para a empresa.
    SELECT
        COALESCE(SUM(dp.valor_mensal), 0)
    INTO
        v_custo_mensal_total
    FROM dados_planos AS dp
    JOIN cnpjs AS c ON dp.cnpj_id = c.id
    WHERE
        c.empresa_id = p_empresa_id;

    -- O RESTO DA FUNÇÃO ORIGINAL, QUE JÁ FUNCIONAVA, MANTIDO INTACTO COM CORREÇÕES
    SELECT json_build_object(
        'total_cnpjs', (SELECT COUNT(*) FROM cnpjs WHERE empresa_id = p_empresa_id AND status = 'ativo'),
        'total_funcionarios', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id),
        'funcionarios_ativos', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo'),
        'funcionarios_pendentes', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'pendente'),
        'custo_mensal_total', v_custo_mensal_total, -- <-- USANDO O CÁLCULO CORRETO E SIMPLES
        'distribuicao_cargos', (
            SELECT json_agg(cargo_counts)
            FROM (
                SELECT f.cargo, COUNT(*) as count
                FROM funcionarios f
                JOIN cnpjs c ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo'
                GROUP BY f.cargo ORDER BY count DESC LIMIT 5
            ) cargo_counts
        ),
        'custos_por_cnpj', (
            SELECT json_agg(cnpj_data)
            FROM (
                SELECT 
                    c.id as cnpj_id,
                    c.cnpj,
                    c.razao_social,
                    COALESCE(dp.valor_mensal, 0) as valor_mensal,
                    COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_count
                FROM cnpjs c
                LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
                LEFT JOIN funcionarios f ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo'
                GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
                ORDER BY c.razao_social
            ) cnpj_data
        ),
        'evolucao_mensal', (
            SELECT json_agg(stats ORDER BY mes)
            FROM (
                SELECT
                    TO_CHAR(d.mes, 'YYYY-MM') AS mes,
                    COUNT(DISTINCT f.id) AS funcionarios,
                    COALESCE(SUM(dp.valor_mensal), 0) AS custo -- Lógica de custo simplificada para o gráfico
                FROM generate_series(
                         date_trunc('month', now() - interval '5 month'),
                         date_trunc('month', now()),
                         '1 month'
                     ) AS d(mes)
                LEFT JOIN cnpjs c ON c.empresa_id = p_empresa_id
                LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
                LEFT JOIN funcionarios f ON f.cnpj_id = c.id
                    -- Condição para contar apenas funcionários que estavam ATIVOS no respectivo mês
                    AND f.status = 'ativo'
                    AND f.created_at < (d.mes + interval '1 month')
                    AND (f.data_exclusao IS NULL OR f.data_exclusao >= d.mes)
                GROUP BY d.mes
            ) stats
        )
    )
    INTO result;

    RETURN result;
END;
$$;