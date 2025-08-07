
-- Drop para garantir que a assinatura usada pelo frontend seja a válida
DROP FUNCTION IF EXISTS public.get_detailed_costs_report(uuid, date, date);

-- Função corrigida
CREATE OR REPLACE FUNCTION public.get_detailed_costs_report(
  p_empresa_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_start date := COALESCE(p_start_date, date_trunc('month', CURRENT_DATE - interval '5 months')::date);
  v_end   date := COALESCE(p_end_date, CURRENT_DATE);
  v_total_mes numeric := 0;
  v_total_periodo numeric := 0;
  v_total_funcionarios_ativos int := 0;
  v_variacao_percentual numeric := 0;
  v_mes_atual numeric := 0;
  v_mes_anterior numeric := 0;
  v_result jsonb;
BEGIN
  -- CTEs principais
  WITH months AS (
    SELECT gs::date AS month_start
    FROM generate_series(
           date_trunc('month', v_start)::date,
           date_trunc('month', v_end)::date,
           interval '1 month'
         ) AS gs
  ),
  cnpjs_empresa AS (
    SELECT c.id, c.cnpj, c.razao_social
    FROM public.cnpjs c
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
  ),
  plans AS (
    SELECT dp.id,
           dp.cnpj_id,
           dp.seguradora,
           dp.valor_mensal,
           dp.tipo_seguro,
           dp.created_at
    FROM public.dados_planos dp
    JOIN cnpjs_empresa ce ON ce.id = dp.cnpj_id
  ),
  total_mes AS (
    SELECT COALESCE(SUM(valor_mensal), 0) AS soma
    FROM plans
  ),
  evolucao AS (
    SELECT 
      to_char(m.month_start, 'YYYY-MM') AS mes,
      to_char(m.month_start, 'Mon YYYY') AS mes_nome,
      COALESCE((SELECT soma FROM total_mes), 0) AS custo_total,
      COALESCE((
        SELECT COUNT(1)
        FROM public.funcionarios f
        JOIN cnpjs_empresa ce ON ce.id = f.cnpj_id
        WHERE f.status = 'ativo'
          AND f.created_at <= (m.month_start + interval '1 month' - interval '1 day')
      ), 0) AS funcionarios
    FROM months m
    ORDER BY m.month_start
  ),
  dist_cnpjs AS (
    SELECT 
      ce.cnpj,
      ce.razao_social,
      COALESCE(pl.valor_mensal, 0) AS valor_mensal,
      COALESCE((
        SELECT COUNT(1)
        FROM public.funcionarios f 
        WHERE f.cnpj_id = ce.id AND f.status = 'ativo'
      ), 0) AS funcionarios_ativos
    FROM cnpjs_empresa ce
    LEFT JOIN plans pl ON pl.cnpj_id = ce.id
  ),
  totals AS (
    SELECT 
      (SELECT soma FROM total_mes) AS custo_total_mes,
      (SELECT COUNT(1)
         FROM public.funcionarios f 
         JOIN cnpjs_empresa ce2 ON ce2.id = f.cnpj_id 
        WHERE f.status = 'ativo') AS funcionarios_ativos,
      (SELECT COUNT(*) FROM months) AS meses_no_periodo
  )
  SELECT (SELECT custo_total_mes FROM totals)
    INTO v_total_mes;

  SELECT COALESCE(meses_no_periodo, 0) * v_total_mes
    FROM totals
    INTO v_total_periodo;

  SELECT funcionarios_ativos
    FROM totals
    INTO v_total_funcionarios_ativos;

  -- Variação percentual (mes_atual vs mes_anterior)
  v_mes_atual := v_total_mes;
  v_mes_anterior := v_total_mes; -- sem histórico de alteração do plano, assume mesmo valor
  IF v_mes_anterior > 0 THEN
    v_variacao_percentual := ROUND(((v_mes_atual - v_mes_anterior) / v_mes_anterior) * 100, 2);
  ELSE
    v_variacao_percentual := 0;
  END IF;

  -- Monta JSON final
  v_result := jsonb_build_object(
    'kpis', jsonb_build_object(
      'custo_total_periodo', COALESCE(v_total_periodo, 0),
      'custo_medio_funcionario', CASE 
        WHEN v_total_funcionarios_ativos > 0 
          THEN ROUND((v_total_mes / v_total_funcionarios_ativos)::numeric, 2) 
        ELSE 0 
      END,
      'variacao_percentual', COALESCE(v_variacao_percentual, 0),
      'total_funcionarios_ativos', COALESCE(v_total_funcionarios_ativos, 0)
    ),
    'evolucao_temporal', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'mes', e.mes,
          'mes_nome', e.mes_nome,
          'custo_total', e.custo_total,
          'funcionarios', e.funcionarios
        )
        ORDER BY e.mes
      )
      FROM evolucao e
    ), '[]'::jsonb),
    'distribuicao_cnpjs', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'cnpj', d.cnpj,
          'razao_social', d.razao_social,
          'valor_mensal', d.valor_mensal,
          'funcionarios_ativos', d.funcionarios_ativos,
          'custo_por_funcionario', CASE 
            WHEN d.funcionarios_ativos > 0 
              THEN ROUND((d.valor_mensal / d.funcionarios_ativos)::numeric, 2) 
            ELSE 0 
          END,
          'percentual_total', CASE 
            WHEN v_total_mes > 0 
              THEN ROUND((d.valor_mensal / v_total_mes) * 100, 2) 
            ELSE 0 
          END
        )
        ORDER BY d.razao_social
      )
      FROM dist_cnpjs d
    ), '[]'::jsonb),
    'tabela_detalhada', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'cnpj_id', ce.id,
          'cnpj', ce.cnpj,
          'razao_social', ce.razao_social,
          'seguradora', pl.seguradora,
          'valor_mensal', COALESCE(pl.valor_mensal, 0),
          'funcionarios_ativos', (
            SELECT COUNT(1) 
            FROM public.funcionarios f 
            WHERE f.cnpj_id = ce.id AND f.status = 'ativo'
          ),
          'custo_por_funcionario', CASE 
            WHEN (SELECT COUNT(1) FROM public.funcionarios f WHERE f.cnpj_id = ce.id AND f.status = 'ativo') > 0 
              THEN ROUND( (COALESCE(pl.valor_mensal,0) / 
                          (SELECT COUNT(1) FROM public.funcionarios f WHERE f.cnpj_id = ce.id AND f.status = 'ativo'))::numeric, 2)
            ELSE 0
          END,
          'data_inicio_plano', pl.created_at,
          'tipo_seguro', pl.tipo_seguro
        )
        ORDER BY ce.razao_social
      )
      FROM cnpjs_empresa ce
      LEFT JOIN plans pl ON pl.cnpj_id = ce.id
    ), '[]'::jsonb),
    'periodo', jsonb_build_object('inicio', v_start, 'fim', v_end)
  );

  RETURN v_result;
END;
$$;
