-- Fix financial report to properly include health plans with calculated values
-- This applies the same logic we used for the cost report to ensure health plans are included

CREATE OR REPLACE FUNCTION get_relatorio_financeiro_corretora(p_corretora_id uuid)
RETURNS TABLE (
    empresa_id uuid,
    empresa_nome text,
    total_cnpjs_ativos bigint,
    total_funcionarios_segurados bigint,
    custo_total_mensal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH planos_calculados AS (
        SELECT 
            dp.cnpj_id,
            dp.tipo_seguro,
            CASE 
                -- For health plans with no configured value, calculate based on employees
                WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
                    (SELECT COUNT(*) FROM planos_funcionarios pf 
                     WHERE pf.plano_id = dp.id AND pf.status = 'ativo') * 200.0
                -- For health plans with configured value or life insurance plans, use the configured value
                ELSE COALESCE(dp.valor_mensal, 0)
            END as valor_calculado
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
    )
    SELECT 
        e.id as empresa_id,
        e.nome as empresa_nome,
        COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND EXISTS(SELECT 1 FROM planos_calculados pc WHERE pc.cnpj_id = c.id) THEN c.id END) as total_cnpjs_ativos,
        COUNT(DISTINCT CASE WHEN f.status IN ('ativo', 'pendente') THEN f.id END) as total_funcionarios_segurados,
        -- Sum calculated values for both life and health plans
        COALESCE(SUM(DISTINCT CASE 
            WHEN c.status = 'ativo' THEN 
                (SELECT SUM(pc.valor_calculado) FROM planos_calculados pc WHERE pc.cnpj_id = c.id)
            ELSE 0 
        END), 0) as custo_total_mensal
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    WHERE e.corretora_id = p_corretora_id
    GROUP BY e.id, e.nome
    HAVING COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND EXISTS(SELECT 1 FROM planos_calculados pc WHERE pc.cnpj_id = c.id) THEN c.id END) > 0
    ORDER BY custo_total_mensal DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_relatorio_financeiro_corretora(uuid) TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_relatorio_financeiro_corretora(uuid) IS 
'Gets financial report for broker including both life insurance and health plans with proper value calculation';
