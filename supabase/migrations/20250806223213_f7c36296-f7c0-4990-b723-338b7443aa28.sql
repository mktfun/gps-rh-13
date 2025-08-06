
-- Função RPC otimizada para buscar todas as métricas do dashboard da empresa com período dinâmico
CREATE OR REPLACE FUNCTION get_empresa_dashboard_metrics(p_empresa_id uuid, p_months integer DEFAULT 6)
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

    -- Buscar custos por CNPJ
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

    -- Evolução mensal dinâmica baseada no parâmetro p_months
    WITH dynamic_months AS (
        -- Gera a série dos últimos N meses baseado no parâmetro
        SELECT generate_series(
            DATE_TRUNC('month', CURRENT_DATE) - INTERVAL (p_months - 1) || ' months',
            DATE_TRUNC('month', CURRENT_DATE),
            INTERVAL '1 month'
        )::date AS mes
    ),
    monthly_hires AS (
        -- Calcula quantos funcionários novos entraram em cada mês
        SELECT
            DATE_TRUNC('month', f.created_at)::date AS mes,
            COUNT(f.id) AS funcionarios
        FROM public.funcionarios f
        JOIN public.cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY 1
    ),
    monthly_costs AS (
        -- Calcula o custo total dos planos iniciados em cada mês
        SELECT
            DATE_TRUNC('month', dp.created_at)::date AS mes,
            SUM(dp.valor_mensal) AS custo
        FROM public.dados_planos dp
        JOIN public.cnpjs c ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY 1
    )
    -- Junta tudo, garantindo que todos os meses apareçam, mesmo que com valor zero
    SELECT json_agg(
        json_build_object(
            'mes', TO_CHAR(m.mes, 'Mon/YY'),
            'funcionarios', COALESCE(h.funcionarios, 0)::integer,
            'custo', COALESCE(c.custo, 0)::numeric
        ) ORDER BY m.mes
    ) INTO evolucao_mensal
    FROM dynamic_months m
    LEFT JOIN monthly_hires h ON m.mes = h.mes
    LEFT JOIN monthly_costs c ON m.mes = c.mes;

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
GRANT EXECUTE ON FUNCTION get_empresa_dashboard_metrics(uuid, integer) TO authenticated;
