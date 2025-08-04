
CREATE OR REPLACE FUNCTION public.get_top_empresas_receita()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    WITH empresa_metricas AS (
        SELECT 
            e.id,
            e.nome,
            COALESCE(SUM(dp.valor_mensal), 0) as receita_mensal,
            COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_ativos,
            COUNT(CASE WHEN f.status IN ('pendente', 'exclusao_solicitada') THEN 1 END) as pendencias
        FROM empresas e
        LEFT JOIN cnpjs c ON c.empresa_id = e.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE e.corretora_id = v_corretora_id
        GROUP BY e.id, e.nome
        ORDER BY receita_mensal DESC
        LIMIT 5
    )
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', em.id,
            'nome', em.nome,
            'receita_mensal', em.receita_mensal,
            'funcionarios_ativos', em.funcionarios_ativos,
            'pendencias', em.pendencias
        )
    ) INTO v_result
    FROM empresa_metricas em;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;
