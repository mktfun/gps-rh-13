
-- PASSO 1: CORRIGIR A FUNÇÃO SQL
-- Recriar a função get_empresa_dashboard_metrics com lógica correta

DROP FUNCTION IF EXISTS get_empresa_dashboard_metrics(uuid);

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
    -- Debug: verificar se empresa existe
    IF NOT EXISTS (SELECT 1 FROM empresas WHERE id = p_empresa_id) THEN
        RAISE NOTICE 'Empresa não encontrada: %', p_empresa_id;
        RETURN json_build_object('error', 'Empresa não encontrada');
    END IF;

    -- Calcular KPIs principais
    SELECT COALESCE(COUNT(*), 0) INTO total_cnpjs
    FROM cnpjs
    WHERE empresa_id = p_empresa_id
    AND status = 'ativo';

    SELECT COALESCE(COUNT(*), 0) INTO total_funcionarios
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status IN ('ativo', 'pendente');

    SELECT COALESCE(COUNT(*), 0) INTO funcionarios_ativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'ativo';

    SELECT COALESCE(COUNT(*), 0) INTO funcionarios_pendentes
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

    -- Buscar custos por CNPJ
    SELECT COALESCE(json_agg(
        json_build_object(
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'valor_mensal', COALESCE(dp.valor_mensal, 0),
            'funcionarios_count', COALESCE(func_count.count, 0)
        )
    ), '[]'::json) INTO custos_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN (
        SELECT cnpj_id, COUNT(*) as count
        FROM funcionarios 
        WHERE status IN ('ativo', 'pendente')
        GROUP BY cnpj_id
    ) func_count ON func_count.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo';

    -- Evolução mensal dos últimos 6 meses
    SELECT COALESCE(json_agg(
        json_build_object(
            'mes', TO_CHAR(mes_data, 'Mon YY'),
            'funcionarios', COALESCE(funcionarios_no_mes, 0),
            'custo', COALESCE(custo_no_mes, 0)
        ) ORDER BY mes_data
    ), '[]'::json) INTO evolucao_mensal
    FROM (
        SELECT 
            meses.mes_data,
            COUNT(DISTINCT f.id) as funcionarios_no_mes,
            COALESCE(SUM(DISTINCT dp.valor_mensal), 0) as custo_no_mes
        FROM (
            SELECT generate_series(
                DATE_TRUNC('month', CURRENT_DATE - INTERVAL '5 months'),
                DATE_TRUNC('month', CURRENT_DATE),
                INTERVAL '1 month'
            ) as mes_data
        ) meses
        LEFT JOIN cnpjs c ON c.empresa_id = p_empresa_id AND c.status = 'ativo'
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id 
            AND f.status IN ('ativo', 'pendente')
            AND DATE_TRUNC('month', f.created_at) <= meses.mes_data
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        GROUP BY meses.mes_data
        ORDER BY meses.mes_data
    ) monthly_data;

    -- Distribuição por cargos
    SELECT COALESCE(json_agg(
        json_build_object(
            'cargo', cargo_info.cargo,
            'count', cargo_info.count
        )
    ), '[]'::json) INTO distribuicao_cargos
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
    ) cargo_info;

    -- Buscar plano principal
    SELECT json_build_object(
        'seguradora', dp.seguradora,
        'valor_mensal', dp.valor_mensal,
        'cobertura_morte', dp.cobertura_morte,
        'cobertura_morte_acidental', dp.cobertura_morte_acidental,
        'cobertura_invalidez_acidente', dp.cobertura_invalidez_acidente,
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

    RAISE NOTICE 'Função executada com sucesso para empresa: %. Resultado: %', p_empresa_id, result;

    RETURN result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_empresa_dashboard_metrics(uuid) TO authenticated;
