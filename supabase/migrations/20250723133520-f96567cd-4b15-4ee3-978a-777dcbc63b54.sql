
-- Create function for Monthly Evolution Chart (Bar Chart)
CREATE OR REPLACE FUNCTION public.get_empresa_evolucao_mensal()
RETURNS TABLE(mes text, novos_funcionarios integer) AS $$
DECLARE
    v_empresa_id uuid := get_my_empresa_id();
BEGIN
    RETURN QUERY
    WITH months AS (
        SELECT date_trunc('month', generate_series(now() - interval '5 months', now(), '1 month'))::date AS month
    ),
    monthly_employees AS (
        SELECT date_trunc('month', f.created_at)::date AS month, COUNT(f.id) AS count
        FROM public.funcionarios f
        JOIN public.cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = v_empresa_id AND f.created_at >= now() - interval '6 months'
        GROUP BY 1
    )
    SELECT 
        to_char(m.month, 'Mon/YY') AS mes,
        COALESCE(me.count, 0)::int AS novos_funcionarios
    FROM months m
    LEFT JOIN monthly_employees me ON m.month = me.month
    ORDER BY m.month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for Position Distribution Chart (Pie Chart)
CREATE OR REPLACE FUNCTION public.get_empresa_distribuicao_cargos()
RETURNS TABLE(cargo text, "count" integer) AS $$
DECLARE
    v_empresa_id uuid := get_my_empresa_id();
BEGIN
    RETURN QUERY
    SELECT 
        f.cargo::text,
        COUNT(f.id)::int as "count"
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = v_empresa_id AND f.status = 'ativo'
    GROUP BY f.cargo
    ORDER BY "count" DESC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
