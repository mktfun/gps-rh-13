
-- Correção da evolução mensal: custo não deve multiplicar por funcionários.
-- Cálculos de custo e funcionários desacoplados e somados de forma cumulativa.

CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics(p_empresa_id uuid)
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
    -- KPIs principais
    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs
    WHERE empresa_id = p_empresa_id
      AND status = 'ativo';

    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status IN ('ativo', 'pendente');

    SELECT COUNT(*) INTO funcionarios_ativos
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'ativo';

    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'pendente';

    -- Custo mensal total atual (somar planos ativos da empresa)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';

    -- Custos por CNPJ (sem multiplicar por funcionários)
    SELECT json_agg(
      json_build_object(
        'cnpj', c.cnpj,
        'razao_social', c.razao_social,
        'valor_mensal', COALESCE(dp.valor_mensal, 0),
        'funcionarios_count', COALESCE(cnt.funcionarios_count, 0)
      )
    )
    INTO custos_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN LATERAL (
      SELECT COUNT(f.id) AS funcionarios_count
      FROM funcionarios f
      WHERE f.cnpj_id = c.id
        AND f.status IN ('ativo', 'pendente')
    ) cnt ON TRUE
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';

    -- Evolução mensal cumulativa dos últimos 6 meses
    WITH meses AS (
      SELECT date_trunc('month', generate_series(
        current_date - interval '5 months',
        current_date,
        interval '1 month'
      ))::date AS mes_ano
    ),
    planos_empresa AS (
      SELECT date_trunc('month', dp.created_at)::date AS mes_ativacao, dp.valor_mensal
      FROM dados_planos dp
      JOIN cnpjs c ON dp.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
    ),
    custo_adicionado_por_mes AS (
      SELECT mes_ativacao, SUM(valor_mensal) AS custo_add
      FROM planos_empresa
      GROUP BY mes_ativacao
    ),
    funcionarios_empresa AS (
      SELECT date_trunc('month', f.created_at)::date AS mes_contratacao, f.id
      FROM funcionarios f
      JOIN cnpjs c ON f.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
    ),
    funcionarios_adicionados_por_mes AS (
      SELECT mes_contratacao, COUNT(DISTINCT id) AS funcs_add
      FROM funcionarios_empresa
      GROUP BY mes_contratacao
    ),
    base AS (
      SELECT
        m.mes_ano,
        COALESCE(cam.custo_add, 0)    AS custo_add,
        COALESCE(fam.funcs_add, 0)    AS funcs_add
      FROM meses m
      LEFT JOIN custo_adicionado_por_mes cam ON cam.mes_ativacao   = m.mes_ano
      LEFT JOIN funcionarios_adicionados_por_mes fam ON fam.mes_contratacao = m.mes_ano
      ORDER BY m.mes_ano
    ),
    acumulado AS (
      SELECT
        mes_ano,
        SUM(custo_add) OVER (ORDER BY mes_ano ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS custo_acumulado,
        SUM(funcs_add) OVER (ORDER BY mes_ano ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS funcionarios_acumulados
      FROM base
    )
    SELECT json_agg(
      json_build_object(
        'mes', to_char(mes_ano, 'Mon/YY'),
        'funcionarios', funcionarios_acumulados,
        'custo', custo_acumulado
      ) ORDER BY mes_ano
    )
    INTO evolucao_mensal
    FROM acumulado;

    -- Distribuição por cargos
    SELECT json_agg(
      json_build_object('cargo', cargo, 'count', cnt)
    )
    INTO distribuicao_cargos
    FROM (
      SELECT f.cargo, COUNT(*) AS cnt
      FROM funcionarios f
      JOIN cnpjs c ON f.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
      GROUP BY f.cargo
      ORDER BY cnt DESC
      LIMIT 5
    ) t;

    -- Plano principal (mantido)
    SELECT json_build_object(
      'seguradora', dp.seguradora,
      'valor_mensal', dp.valor_mensal,
      'cobertura_morte', dp.cobertura_morte,
      'cobertura_morte_acidental', dp.cobertura_morte_acidental,
      'cobertura_invalidez_acidente', dp.cobertura_invalidez_acidente,
      'razao_social', c.razao_social
    )
    INTO plano_principal
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY dp.valor_mensal DESC, dp.created_at DESC
    LIMIT 1;

    -- Resultado final
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

GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics(uuid) TO authenticated;
