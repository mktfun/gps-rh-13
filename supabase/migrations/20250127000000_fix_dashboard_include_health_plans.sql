-- Corrigir função get_empresa_dashboard_metrics para incluir TODOS os tipos de planos nos cálculos de custo
-- Problema: a função atual não estava contabilizando os planos de saúde nos custos do dashboard

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

    -- CORREÇÃO: Custo mensal total incluindo TODOS os tipos de planos (vida + saúde)
    -- Para planos de saúde, calcular valor baseado em funcionários quando valor_mensal = 0
    SELECT COALESCE(SUM(
      CASE 
        -- Para planos de saúde com valor zero, calcular baseado no número de funcionários
        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
          COALESCE((
            SELECT COUNT(*) * 300.00  -- Valor padrão R$ 300 por funcionário em planos de saúde
            FROM funcionarios f 
            WHERE f.cnpj_id = c.id 
              AND f.status = 'ativo'
          ), 0)
        -- Para outros planos, usar o valor configurado
        ELSE COALESCE(dp.valor_mensal, 0)
      END
    ), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
      AND dp.tipo_seguro IN ('vida', 'saude'); -- Incluir explicitamente vida e saúde

    -- CORREÇÃO: Custos por CNPJ incluindo TODOS os tipos de planos
    SELECT json_agg(
      json_build_object(
        'cnpj', c.cnpj,
        'razao_social', c.razao_social,
        'valor_mensal', COALESCE(custos.valor_total, 0),
        'funcionarios_count', COALESCE(cnt.funcionarios_count, 0)
      )
    )
    INTO custos_por_cnpj
    FROM cnpjs c
    LEFT JOIN LATERAL (
      SELECT SUM(
        CASE 
          -- Para planos de saúde com valor zero, calcular baseado no número de funcionários
          WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
            COALESCE((
              SELECT COUNT(*) * 300.00
              FROM funcionarios f 
              WHERE f.cnpj_id = c.id 
                AND f.status = 'ativo'
            ), 0)
          -- Para outros planos, usar o valor configurado
          ELSE COALESCE(dp.valor_mensal, 0)
        END
      ) AS valor_total
      FROM dados_planos dp 
      WHERE dp.cnpj_id = c.id
        AND dp.tipo_seguro IN ('vida', 'saude')
    ) custos ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(f.id) AS funcionarios_count
      FROM funcionarios f
      WHERE f.cnpj_id = c.id
        AND f.status IN ('ativo', 'pendente')
    ) cnt ON TRUE
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';

    -- CORREÇÃO: Evolução mensal incluindo TODOS os tipos de planos
    WITH meses AS (
      SELECT date_trunc('month', generate_series(
        current_date - interval '5 months',
        current_date,
        interval '1 month'
      ))::date AS mes_ano
    ),
    planos_empresa AS (
      SELECT 
        date_trunc('month', dp.created_at)::date AS mes_ativacao, 
        CASE 
          -- Para planos de saúde com valor zero, calcular baseado no número de funcionários na época
          WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
            COALESCE((
              SELECT COUNT(*) * 300.00
              FROM funcionarios f 
              WHERE f.cnpj_id = dp.cnpj_id 
                AND f.status = 'ativo'
                AND f.created_at <= dp.created_at
            ), 0)
          ELSE dp.valor_mensal
        END AS valor_mensal
      FROM dados_planos dp
      JOIN cnpjs c ON dp.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
        AND dp.tipo_seguro IN ('vida', 'saude')
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

    -- Distribuição por cargos (sem alterações)
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

    -- CORREÇÃO: Plano principal considerando TODOS os tipos de planos
    SELECT json_build_object(
      'seguradora', dp.seguradora,
      'valor_mensal', CASE 
        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
          COALESCE((
            SELECT COUNT(*) * 300.00
            FROM funcionarios f 
            WHERE f.cnpj_id = c.id 
              AND f.status = 'ativo'
          ), 0)
        ELSE dp.valor_mensal
      END,
      'cobertura_morte', dp.cobertura_morte,
      'cobertura_morte_acidental', dp.cobertura_morte_acidental,
      'cobertura_invalidez_acidente', dp.cobertura_invalidez_acidente,
      'razao_social', c.razao_social,
      'tipo_seguro', dp.tipo_seguro
    )
    INTO plano_principal
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
      AND dp.tipo_seguro IN ('vida', 'saude')
    ORDER BY 
      CASE 
        WHEN dp.tipo_seguro = 'saude' AND (dp.valor_mensal IS NULL OR dp.valor_mensal = 0) THEN
          COALESCE((
            SELECT COUNT(*) * 300.00
            FROM funcionarios f 
            WHERE f.cnpj_id = c.id 
              AND f.status = 'ativo'
          ), 0)
        ELSE dp.valor_mensal
      END DESC, 
      dp.created_at DESC
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

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics(uuid) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_empresa_dashboard_metrics(uuid) IS 
'Retorna métricas do dashboard da empresa incluindo custos de TODOS os tipos de planos (vida + saúde). 
Para planos de saúde com valor_mensal = 0, calcula automaticamente baseado no número de funcionários ativos * R$ 300.';
