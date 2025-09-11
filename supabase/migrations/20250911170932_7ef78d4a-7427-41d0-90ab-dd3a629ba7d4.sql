-- Fix get_corretora_dashboard_metrics function to return snake_case keys and proper auth scoping
CREATE OR REPLACE FUNCTION public.get_corretora_dashboard_metrics()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SET search_path = 'public';
    
    -- Validate user is authenticated and is a corretora
    IF v_corretora_id IS NULL THEN
        RAISE EXCEPTION 'Usuário não autenticado';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = v_corretora_id AND role = 'corretora'
    ) THEN
        RAISE EXCEPTION 'Usuário não é uma corretora';
    END IF;

    -- Build comprehensive dashboard metrics with snake_case keys
    WITH empresas_corretora AS (
        SELECT e.id, e.nome, e.created_at
        FROM empresas e
        WHERE e.corretora_id = v_corretora_id
    ),
    cnpjs_ativos AS (
        SELECT c.id, c.empresa_id, c.razao_social, c.cnpj
        FROM cnpjs c
        INNER JOIN empresas_corretora ec ON c.empresa_id = ec.id
        WHERE c.status = 'ativo'
    ),
    funcionarios_stats AS (
        SELECT 
            COUNT(*) as total_funcionarios,
            COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_ativos,
            COUNT(CASE WHEN f.status = 'pendente' THEN 1 END) as funcionarios_pendentes
        FROM funcionarios f
        INNER JOIN cnpjs_ativos ca ON f.cnpj_id = ca.id
    ),
    planos_receita AS (
        SELECT 
            COALESCE(SUM(dp.valor_mensal), 0) as receita_mensal_estimada
        FROM dados_planos dp
        INNER JOIN cnpjs_ativos ca ON dp.cnpj_id = ca.id
    ),
    empresas_recentes AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', ec.id,
                    'nome', ec.nome,
                    'created_at', ec.created_at,
                    'funcionarios_count', COALESCE(func_count.total, 0),
                    'receita_mensal', COALESCE(plano_receita.receita, 0)
                )
                ORDER BY ec.created_at DESC
            ) as empresas_recentes
        FROM empresas_corretora ec
        LEFT JOIN (
            SELECT 
                ca.empresa_id,
                COUNT(f.id) as total
            FROM funcionarios f
            INNER JOIN cnpjs_ativos ca ON f.cnpj_id = ca.id
            WHERE f.status IN ('ativo', 'pendente')
            GROUP BY ca.empresa_id
        ) func_count ON ec.id = func_count.empresa_id
        LEFT JOIN (
            SELECT 
                ca.empresa_id,
                SUM(dp.valor_mensal) as receita
            FROM dados_planos dp
            INNER JOIN cnpjs_ativos ca ON dp.cnpj_id = ca.id
            GROUP BY ca.empresa_id
        ) plano_receita ON ec.id = plano_receita.empresa_id
        LIMIT 5
    ),
    ranking_empresas AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', ec.id,
                    'nome', ec.nome,
                    'receita_mensal', COALESCE(plano_receita.receita, 0),
                    'funcionarios_count', COALESCE(func_count.total, 0)
                )
                ORDER BY COALESCE(plano_receita.receita, 0) DESC
            ) as ranking_empresas
        FROM empresas_corretora ec
        LEFT JOIN (
            SELECT 
                ca.empresa_id,
                COUNT(f.id) as total
            FROM funcionarios f
            INNER JOIN cnpjs_ativos ca ON f.cnpj_id = ca.id
            WHERE f.status IN ('ativo', 'pendente')
            GROUP BY ca.empresa_id
        ) func_count ON ec.id = func_count.empresa_id
        LEFT JOIN (
            SELECT 
                ca.empresa_id,
                SUM(dp.valor_mensal) as receita
            FROM dados_planos dp
            INNER JOIN cnpjs_ativos ca ON dp.cnpj_id = ca.id
            GROUP BY ca.empresa_id
        ) plano_receita ON ec.id = plano_receita.empresa_id
        LIMIT 5
    ),
    distribuicao_status AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'status', f.status,
                    'count', status_count.total
                )
            ) as distribuicao_por_status
        FROM (
            SELECT 
                f.status,
                COUNT(*) as total
            FROM funcionarios f
            INNER JOIN cnpjs_ativos ca ON f.cnpj_id = ca.id
            GROUP BY f.status
        ) status_count
        CROSS JOIN funcionarios f
        WHERE f.id = (SELECT id FROM funcionarios LIMIT 1)
        GROUP BY f.id
        LIMIT 1
    ),
    receita_seguradora AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'seguradora', dp.seguradora,
                    'receita', seg_receita.receita,
                    'empresas_count', seg_receita.empresas_count
                )
            ) as receita_por_seguradora
        FROM (
            SELECT 
                dp.seguradora,
                SUM(dp.valor_mensal) as receita,
                COUNT(DISTINCT ca.empresa_id) as empresas_count
            FROM dados_planos dp
            INNER JOIN cnpjs_ativos ca ON dp.cnpj_id = ca.id
            GROUP BY dp.seguradora
        ) seg_receita
        CROSS JOIN dados_planos dp
        WHERE dp.id = (SELECT id FROM dados_planos LIMIT 1)
        GROUP BY dp.id
        LIMIT 1
    )
    SELECT jsonb_build_object(
        'corretora_id', v_corretora_id,
        'total_empresas', (SELECT COUNT(*) FROM empresas_corretora),
        'total_cnpjs', (SELECT COUNT(*) FROM cnpjs_ativos),
        'total_funcionarios', COALESCE((SELECT total_funcionarios FROM funcionarios_stats), 0),
        'funcionarios_pendentes', COALESCE((SELECT funcionarios_pendentes FROM funcionarios_stats), 0),
        'receita_mensal_estimada', COALESCE((SELECT receita_mensal_estimada FROM planos_receita), 0),
        'empresas_recentes', COALESCE((SELECT empresas_recentes FROM empresas_recentes), '[]'::jsonb),
        'ranking_empresas', COALESCE((SELECT ranking_empresas FROM ranking_empresas), '[]'::jsonb),
        'distribuicao_por_status', COALESCE((SELECT distribuicao_por_status FROM distribuicao_status), '[]'::jsonb),
        'receita_por_seguradora', COALESCE((SELECT receita_por_seguradora FROM receita_seguradora), '[]'::jsonb),
        'security_validated', true
    ) INTO v_result;

    RETURN v_result;
END;
$$;