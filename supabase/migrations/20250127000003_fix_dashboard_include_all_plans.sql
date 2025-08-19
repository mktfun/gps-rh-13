-- Corrigir função get_empresa_dashboard_metrics para incluir TODOS os planos
-- Problema: estava perdendo registros de planos na consulta

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

    -- CORREÇÃO: Custo mensal total - somar TODOS os planos da empresa
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';
    -- Removido filtro de tipo_seguro para incluir TODOS os planos

    -- CORREÇÃO: Custos por CNPJ - agrupar TODOS os planos por CNPJ
    SELECT json_agg(
      json_build_object(
        'cnpj', cnpj_dados.cnpj,
        'razao_social', cnpj_dados.razao_social,
        'valor_mensal', cnpj_dados.valor_total,
        'funcionarios_count', cnpj_dados.funcionarios_count
      )
    )
    INTO custos_por_cnpj
    FROM (
      SELECT 
        c.cnpj,
        c.razao_social,
        COALESCE(SUM(dp.valor_mensal), 0) AS valor_total,
        COUNT(DISTINCT f.id) AS funcionarios_count
      FROM cnpjs c
      LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
      LEFT JOIN funcionarios f ON f.cnpj_id = c.id 
        AND f.status IN ('ativo', 'pendente')
      WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
      GROUP BY c.id, c.cnpj, c.razao_social
      ORDER BY c.razao_social
    ) cnpj_dados;

    -- CORREÇÃO: Evolução mensal - incluir TODOS os planos
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
        dp.valor_mensal
      FROM dados_planos dp
      JOIN cnpjs c ON dp.cnpj_id = c.id
      WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
      -- Removido filtro de tipo_seguro para incluir TODOS os planos
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

    -- CORREÇÃO: Plano principal - incluir TODOS os tipos
    SELECT json_build_object(
      'seguradora', dp.seguradora,
      'valor_mensal', dp.valor_mensal,
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
    -- Removido filtro de tipo_seguro para incluir TODOS os planos
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

-- Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics(uuid) TO authenticated;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_empresa_dashboard_metrics(uuid) IS 
'Retorna métricas do dashboard da empresa incluindo TODOS os planos (vida, saúde, outros) sem filtros de tipo_seguro.';
