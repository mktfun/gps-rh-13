
-- Atualizar função para usar datas reais de ativação
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

    -- Buscar custos por CNPJ usando alias correto
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

    -- NOVA LÓGICA: Evolução mensal usando datas reais de ativação
    WITH funcionarios_com_ativacao AS (
        SELECT 
            f.id,
            f.cnpj_id,
            -- Buscar data real de ativação no audit_log
            COALESCE(
                (SELECT al.created_at 
                 FROM audit_log al 
                 WHERE al.entity_id = f.id::text
                 AND al.table_name = 'funcionarios'
                 AND al.action_type = 'UPDATE'
                 AND al.details->'new_data'->>'status' = 'ativo'
                 AND al.details->'old_data'->>'status' != 'ativo'
                 ORDER BY al.created_at ASC LIMIT 1),
                -- Se não encontrar no audit_log e foi criado como ativo, usar created_at
                CASE WHEN f.status = 'ativo' THEN f.created_at ELSE NULL END
            ) as data_ativacao
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.status = 'ativo'
        AND f.created_at >= CURRENT_DATE - INTERVAL '6 months'
    ),
    cnpjs_com_ativacao AS (
        SELECT 
            c.id,
            dp.valor_mensal,
            -- Buscar data real de ativação do CNPJ no audit_log
            COALESCE(
                (SELECT al.created_at 
                 FROM audit_log al 
                 WHERE al.entity_id = c.id::text
                 AND al.table_name = 'cnpjs'
                 AND al.action_type = 'UPDATE'
                 AND al.details->'new_data'->>'status' = 'ativo'
                 AND al.details->'old_data'->>'status' != 'ativo'
                 ORDER BY al.created_at ASC LIMIT 1),
                -- Se não encontrar no audit_log e foi criado como ativo, usar created_at
                CASE WHEN c.status = 'ativo' THEN c.created_at ELSE NULL END
            ) as data_ativacao
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
        AND c.created_at >= CURRENT_DATE - INTERVAL '6 months'
    )
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
            -- Contar funcionários que foram ativados até este mês
            COUNT(DISTINCT fca.id) as funcionarios_mes,
            -- Somar custos de CNPJs que estavam ativos neste mês
            COALESCE(SUM(DISTINCT cca.valor_mensal), 0) as custo_mes
        FROM (
            SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) as mes_ano
        ) meses
        LEFT JOIN funcionarios_com_ativacao fca ON 
            DATE_TRUNC('month', fca.data_ativacao) <= meses.mes_ano
            AND fca.data_ativacao IS NOT NULL
        LEFT JOIN cnpjs_com_ativacao cca ON 
            DATE_TRUNC('month', cca.data_ativacao) <= meses.mes_ano
            AND cca.data_ativacao IS NOT NULL
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
