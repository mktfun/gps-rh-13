-- Fix the get_empresa_dashboard_metrics function to prevent JSON syntax errors
CREATE OR REPLACE FUNCTION get_empresa_dashboard_metrics(p_empresa_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
    result json;
    custo_mensal_total numeric := 0;
    total_cnpjs integer := 0;
    total_funcionarios integer := 0;
    funcionarios_ativos integer := 0;
    funcionarios_pendentes integer := 0;
    custos_por_cnpj json;
    evolucao_mensal json;
    distribuicao_cargos json;
    plano_principal json;
BEGIN
    -- Validar se o parâmetro foi fornecido
    IF p_empresa_id IS NULL THEN
        RAISE EXCEPTION 'ID da empresa é obrigatório';
    END IF;

    -- Calcular KPIs principais
    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs
    WHERE empresa_id = p_empresa_id
    AND status = 'ativo';

    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status IN ('ativo', 'pendente');

    SELECT COUNT(*) INTO funcionarios_ativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'ativo';

    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'pendente';

    -- Calcular custo mensal total
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo';

    -- CORREÇÃO: Buscar custos por CNPJ usando alias correto
    SELECT json_agg(
        json_build_object(
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'valor_mensal', COALESCE(c.valor_mensal, 0),
            'funcionarios_count', COALESCE(c.funcionarios_count, 0)
        )
    ) INTO custos_por_cnpj
    FROM (
        SELECT 
            c.id,
            c.cnpj,
            c.razao_social,
            dp.valor_mensal,
            COUNT(f.id) as funcionarios_count
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
        GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
    ) c;

    -- CORREÇÃO: Evolução mensal SAFE - usar json_build_object em vez de concatenação
    SELECT json_agg(
        json_build_object(
            'mes', TO_CHAR(mes_data, 'Mon YY'),
            'funcionarios', COALESCE(func_count, 0),
            'custo', COALESCE(custo_valor, 0)
        ) ORDER BY mes_data
    ) INTO evolucao_mensal
    FROM (
        SELECT 
            generate_series(
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) as mes_data
    ) meses
    LEFT JOIN (
        SELECT 
            DATE_TRUNC('month', f.created_at) as mes,
            COUNT(DISTINCT f.id) as func_count,
            COALESCE(custo_mensal_total, 0) as custo_valor
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
        AND f.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months')
        GROUP BY DATE_TRUNC('month', f.created_at)
    ) stats ON meses.mes_data = stats.mes;

    -- Distribuição por cargos
    SELECT json_agg(
        json_build_object(
            'cargo', cargo,
            'count', count
        )
    ) INTO distribuicao_cargos
    FROM (
        SELECT 
            f.cargo,
            COUNT(*) as count
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
        GROUP BY f.cargo
        ORDER BY count DESC
        LIMIT 5
    ) cargo_counts;

    -- Buscar plano principal
    SELECT json_build_object(
        'seguradora', dp.seguradora,
        'valor_mensal', COALESCE(dp.valor_mensal, 0),
        'cobertura_morte', COALESCE(dp.cobertura_morte, 0),
        'cobertura_morte_acidental', COALESCE(dp.cobertura_morte_acidental, 0),
        'cobertura_invalidez_acidente', COALESCE(dp.cobertura_invalidez_acidade, 0),
        'razao_social', c.razao_social
    ) INTO plano_principal
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    ORDER BY dp.valor_mensal DESC, dp.created_at DESC
    LIMIT 1;

    -- Construir resultado final SAFE
    result := json_build_object(
        'totalCnpjs', total_cnpjs,
        'totalFuncionarios', total_funcionarios,
        'funcionariosAtivos', funcionarios_ativos,
        'funcionariosPendentes', funcionarios_pendentes,
        'custoMensalTotal', custo_mensal_total,
        'custosPorCnpj', COALESCE(custos_por_cnpj, '[]'::json),
        'evolucaoMensal', COALESCE(evolucao_mensal, '[]'::json),
        'distribuicaoCargos', COALESCE(distribuicao_cargos, '[]'::json),
        'planoPrincipal', plano_principal
    );

    RETURN result;
END;
$$;