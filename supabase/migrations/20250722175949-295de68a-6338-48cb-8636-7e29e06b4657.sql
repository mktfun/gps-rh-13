
CREATE OR REPLACE FUNCTION public.get_dashboard_details_corretora()
RETURNS jsonb AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    evolucao_mensal_json jsonb;
    empresas_recentes_json jsonb;
BEGIN
    -- 1. Lógica para o Gráfico de Barras (Evolução Mensal)
    WITH months AS (
        SELECT date_trunc('month', generate_series(now() - interval '5 months', now(), '1 month'))::date AS month
    ),
    monthly_employees AS (
        SELECT date_trunc('month', f.created_at)::date AS month, COUNT(f.id) AS count
        FROM public.funcionarios f
        JOIN public.cnpjs c ON f.cnpj_id = c.id
        JOIN public.empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = v_corretora_id AND f.created_at >= now() - interval '6 months'
        GROUP BY 1
    )
    SELECT jsonb_agg(t)
    INTO evolucao_mensal_json
    FROM (
        SELECT 
            to_char(m.month, 'YYYY-MM') AS mes,
            COALESCE(me.count, 0)::int AS novos_funcionarios
        FROM months m
        LEFT JOIN monthly_employees me ON m.month = me.month
        ORDER BY m.month
    ) t;

    -- 2. Lógica para a Lista de Empresas Recentes
    SELECT jsonb_agg(er)
    INTO empresas_recentes_json
    FROM (
        SELECT 
            id,
            nome,
            created_at
        FROM public.empresas
        WHERE corretora_id = v_corretora_id
        ORDER BY created_at DESC
        LIMIT 5
    ) er;

    -- 3. Combina tudo em um único objeto JSON
    RETURN jsonb_build_object(
        'evolucao_mensal', COALESCE(evolucao_mensal_json, '[]'::jsonb),
        'empresas_recentes', COALESCE(empresas_recentes_json, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
