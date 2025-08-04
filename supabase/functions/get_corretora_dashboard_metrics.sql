
-- Função RPC otimizada para buscar todas as métricas do dashboard da corretora
CREATE OR REPLACE FUNCTION get_corretora_dashboard_metrics(p_corretora_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result json;
    receita_total numeric := 0;
    total_empresas integer := 0;
    total_cnpjs integer := 0;
    total_funcionarios integer := 0;
    funcionarios_pendentes integer := 0;
    empresas_recentes json;
    estatisticas_mensais json;
    distribuicao_status json;
    receita_seguradora json;
    ranking_empresas json;
BEGIN
    -- Calcular KPIs principais
    SELECT COUNT(*) INTO total_empresas
    FROM empresas
    WHERE corretora_id = p_corretora_id;

    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs c
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND c.status = 'ativo';

    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND f.status IN ('ativo', 'pendente');

    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND f.status = 'pendente_exclusao';

    -- Calcular receita mensal total
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO receita_total
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND c.status = 'ativo';

    -- Buscar empresas recentes com receita
    SELECT json_agg(
        json_build_object(
            'id', emp.id,
            'nome', emp.nome,
            'created_at', emp.created_at,
            'funcionarios_count', COALESCE(emp.funcionarios_count, 0),
            'receita_mensal', COALESCE(emp.receita_mensal, 0)
        )
    ) INTO empresas_recentes
    FROM (
        SELECT 
            e.id,
            e.nome,
            e.created_at,
            COUNT(f.id) as funcionarios_count,
            COALESCE(SUM(dp.valor_mensal), 0) as receita_mensal
        FROM empresas e
        LEFT JOIN cnpjs c ON c.empresa_id = e.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE e.corretora_id = p_corretora_id
        GROUP BY e.id, e.nome, e.created_at
        ORDER BY e.created_at DESC
        LIMIT 5
    ) emp;

    -- Estatísticas mensais dos últimos 6 meses
    SELECT json_agg(
        json_build_object(
            'mes', TO_CHAR(mes_ano, 'Mon YY'),
            'funcionarios', COALESCE(funcionarios, 0),
            'empresas', COALESCE(empresas, 0),
            'receita', COALESCE(receita, 0)
        ) ORDER BY mes_ano
    ) INTO estatisticas_mensais
    FROM (
        SELECT 
            DATE_TRUNC('month', meses.mes) as mes_ano,
            COUNT(DISTINCT CASE WHEN f.created_at >= DATE_TRUNC('month', meses.mes) 
                                AND f.created_at < DATE_TRUNC('month', meses.mes) + INTERVAL '1 month' 
                                THEN f.id END) as funcionarios,
            COUNT(DISTINCT CASE WHEN e.created_at >= DATE_TRUNC('month', meses.mes) 
                                AND e.created_at < DATE_TRUNC('month', meses.mes) + INTERVAL '1 month' 
                                THEN e.id END) as empresas,
            COALESCE(SUM(CASE WHEN f.created_at >= DATE_TRUNC('month', meses.mes) 
                             AND f.created_at < DATE_TRUNC('month', meses.mes) + INTERVAL '1 month' 
                             THEN dp.valor_mensal ELSE 0 END), 0) as receita
        FROM (
            SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) as mes
        ) meses
        LEFT JOIN empresas e ON e.corretora_id = p_corretora_id
        LEFT JOIN cnpjs c ON c.empresa_id = e.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        GROUP BY DATE_TRUNC('month', meses.mes)
    ) monthly_stats;

    -- Distribuição por status
    SELECT json_agg(
        json_build_object(
            'status', UPPER(REPLACE(status, '_', ' ')),
            'count', count
        )
    ) INTO distribuicao_status
    FROM (
        SELECT 
            f.status,
            COUNT(*) as count
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
        GROUP BY f.status
    ) status_counts;

    -- Receita por seguradora
    SELECT json_agg(
        json_build_object(
            'seguradora', seguradora,
            'valor_total', valor_total,
            'empresas_count', empresas_count
        )
    ) INTO receita_seguradora
    FROM (
        SELECT 
            dp.seguradora,
            SUM(dp.valor_mensal) as valor_total,
            COUNT(DISTINCT e.id) as empresas_count
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
        AND c.status = 'ativo'
        GROUP BY dp.seguradora
    ) seg_revenue;

    -- Ranking de empresas por receita
    SELECT json_agg(
        json_build_object(
            'id', id,
            'nome', nome,
            'funcionarios_count', funcionarios_count,
            'receita_mensal', receita_mensal
        )
    ) INTO ranking_empresas
    FROM (
        SELECT 
            e.id,
            e.nome,
            COUNT(f.id) as funcionarios_count,
            COALESCE(SUM(dp.valor_mensal), 0) as receita_mensal
        FROM empresas e
        LEFT JOIN cnpjs c ON c.empresa_id = e.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE e.corretora_id = p_corretora_id
        GROUP BY e.id, e.nome
        ORDER BY receita_mensal DESC
        LIMIT 5
    ) ranking;

    -- Construir resultado final
    result := json_build_object(
        'totalEmpresas', total_empresas,
        'totalCnpjs', total_cnpjs,
        'totalFuncionarios', total_funcionarios,
        'funcionariosPendentes', funcionarios_pendentes,
        'receitaMensalEstimada', receita_total,
        'empresasRecentes', COALESCE(empresas_recentes, '[]'::json),
        'estatisticasMensais', COALESCE(estatisticas_mensais, '[]'::json),
        'distribuicaoPorStatus', COALESCE(distribuicao_status, '[]'::json),
        'receitaPorSeguradora', COALESCE(receita_seguradora, '[]'::json),
        'rankingEmpresas', COALESCE(ranking_empresas, '[]'::json)
    );

    RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_corretora_dashboard_metrics(uuid) TO authenticated;
