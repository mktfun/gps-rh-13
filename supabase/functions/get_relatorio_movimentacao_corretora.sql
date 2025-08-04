
CREATE OR REPLACE FUNCTION get_relatorio_movimentacao_corretora(
    p_corretora_id uuid,
    p_data_inicio date,
    p_data_fim date
)
RETURNS TABLE (
    mes text,
    inclusoes bigint,  
    exclusoes bigint,
    saldo bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validação do período (máximo 2 anos) - CORRIGIDA
    IF p_data_fim > p_data_inicio + INTERVAL '2 years' THEN
        RAISE EXCEPTION 'Período não pode ser superior a 2 anos';
    END IF;

    RETURN QUERY
    WITH meses_periodo AS (
        SELECT 
            TO_CHAR(generate_series(
                DATE_TRUNC('month', p_data_inicio),
                DATE_TRUNC('month', p_data_fim),
                INTERVAL '1 month'
            ), 'YYYY-MM') as mes_ref
    ),
    inclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_inclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND DATE(f.created_at) BETWEEN p_data_inicio AND p_data_fim
            AND f.status = 'ativo'
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM')
    ),
    exclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_exclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND f.data_exclusao IS NOT NULL
            AND DATE(f.data_exclusao) BETWEEN p_data_inicio AND p_data_fim
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM')
    )
    SELECT 
        mp.mes_ref as mes,
        COALESCE(im.total_inclusoes, 0) as inclusoes,
        COALESCE(em.total_exclusoes, 0) as exclusoes,
        COALESCE(im.total_inclusoes, 0) - COALESCE(em.total_exclusoes, 0) as saldo
    FROM meses_periodo mp
    LEFT JOIN inclusoes_mes im ON mp.mes_ref = im.mes_ref
    LEFT JOIN exclusoes_mes em ON mp.mes_ref = em.mes_ref
    ORDER BY mp.mes_ref;
END;
$$;
