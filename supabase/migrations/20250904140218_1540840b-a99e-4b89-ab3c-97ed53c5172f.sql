-- CORREÇÃO COMPLETA da função get_empresa_dashboard_metrics
-- Implementa a lógica correta: custo = valor_mensal * funcionários_ativos por CNPJ

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
    SET search_path = 'public';
    
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

    -- NOVA LÓGICA CORRETA: custo = valor_mensal * funcionários_ativos por CNPJ
    SELECT COALESCE(SUM(dp.valor_mensal * funcionarios_ativos_count), 0) INTO custo_mensal_total
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN (
        SELECT cnpj_id, COUNT(*) as funcionarios_ativos_count
        FROM funcionarios 
        WHERE status = 'ativo' 
        GROUP BY cnpj_id
    ) fa ON fa.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo';

    -- Custos por CNPJ com cálculo correto
    SELECT json_agg(
        json_build_object(
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'valor_mensal', COALESCE(dp.valor_mensal, 0),
            'funcionarios_count', COALESCE(fa.funcionarios_count, 0),
            'custo_total', COALESCE(dp.valor_mensal * fa.funcionarios_count, 0)
        )
    ) INTO custos_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN (
        SELECT cnpj_id, COUNT(*) as funcionarios_count
        FROM funcionarios 
        WHERE status = 'ativo'
        GROUP BY cnpj_id
    ) fa ON fa.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    AND dp.id IS NOT NULL
    AND fa.funcionarios_count > 0;

    -- Evolução mensal CORRIGIDA: valor_mensal * funcionários_ativos por mês
    SELECT json_agg(
        json_build_object(
            'mes', TO_CHAR(mes_ano, 'Mon YY'),
            'funcionarios', COALESCE(funcionarios_mes, 0),
            'custo', COALESCE(custo_mes, 0)
        ) ORDER BY mes_ano
    ) INTO evolucao_mensal
    FROM (
        SELECT 
            meses.mes_ano,
            COUNT(DISTINCT f.id) as funcionarios_mes,
            COALESCE(SUM(dp.valor_mensal * fa.func_count), 0) as custo_mes
        FROM (
            SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) as mes_ano
        ) meses
        LEFT JOIN cnpjs c ON c.empresa_id = p_empresa_id AND c.status = 'ativo'
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id 
            AND f.status = 'ativo'
            AND f.created_at <= (meses.mes_ano + INTERVAL '1 month' - INTERVAL '1 day')
            AND (f.data_exclusao IS NULL OR f.data_exclusao >= meses.mes_ano)
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN (
            SELECT cnpj_id, COUNT(*) as func_count
            FROM funcionarios
            WHERE status = 'ativo'
            GROUP BY cnpj_id
        ) fa ON fa.cnpj_id = c.id
        GROUP BY meses.mes_ano
        ORDER BY meses.mes_ano
    ) monthly_stats;

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
        'valor_mensal', dp.valor_mensal,
        'cobertura_morte', dp.cobertura_morte_acidental,
        'cobertura_invalidez', dp.cobertura_invalidez_acidente,
        'razao_social', c.razao_social
    ) INTO plano_principal
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo'
    ORDER BY dp.valor_mensal DESC, dp.created_at DESC
    LIMIT 1;

    -- Construir resultado final
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

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_empresa_dashboard_metrics(uuid) TO authenticated;