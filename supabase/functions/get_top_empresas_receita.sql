
CREATE OR REPLACE FUNCTION get_top_empresas_receita()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
BEGIN
    -- Buscar top empresas por receita (valor fixo do plano, não multiplicado por funcionários)
    SELECT json_agg(
        json_build_object(
            'id', e.id,
            'nome', e.nome,
            'receita_mensal', COALESCE(dp.valor_mensal, 0), -- Valor fixo do plano
            'funcionarios_ativos', COALESCE(func_count.total, 0),
            'pendencias', COALESCE(pend_count.total, 0)
        )
        ORDER BY COALESCE(dp.valor_mensal, 0) DESC
    ) INTO result
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id AND c.status = 'ativo'
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN (
        SELECT 
            c2.empresa_id,
            COUNT(f.id) as total
        FROM cnpjs c2
        LEFT JOIN funcionarios f ON f.cnpj_id = c2.id AND f.status IN ('ativo', 'pendente')
        WHERE c2.status = 'ativo'
        GROUP BY c2.empresa_id
    ) func_count ON func_count.empresa_id = e.id
    LEFT JOIN (
        SELECT 
            c3.empresa_id,
            COUNT(f2.id) as total
        FROM cnpjs c3
        LEFT JOIN funcionarios f2 ON f2.cnpj_id = c3.id AND f2.status = 'pendente_exclusao'
        WHERE c3.status = 'ativo'
        GROUP BY c3.empresa_id
    ) pend_count ON pend_count.empresa_id = e.id
    WHERE dp.valor_mensal IS NOT NULL AND dp.valor_mensal > 0
    LIMIT 10;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_top_empresas_receita() TO authenticated;
