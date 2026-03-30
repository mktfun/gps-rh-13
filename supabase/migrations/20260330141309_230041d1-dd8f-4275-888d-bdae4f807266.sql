-- 1. Resolve orphaned pendencias (employee already ativo but pendencia still pendente)
UPDATE pendencias 
SET status = 'resolvida', updated_at = now()
WHERE status = 'pendente' 
  AND tipo = 'ativacao'
  AND funcionario_id IN (
    SELECT id FROM funcionarios WHERE status = 'ativo'
  );

-- 2. Update get_cnpjs_com_metricas_por_tipo to count ALL pendencia types (not just ativacao)
CREATE OR REPLACE FUNCTION get_cnpjs_com_metricas_por_tipo(
    p_empresa_id UUID,
    p_tipo_plano_filter TEXT
)
RETURNS TABLE (
    id UUID,
    cnpj TEXT,
    razao_social TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    empresa_id UUID,
    plano_id UUID,
    plano_seguradora TEXT,
    plano_valor_mensal NUMERIC,
    total_funcionarios_cnpj BIGINT,
    ativos_no_plano BIGINT,
    pendentes_no_plano BIGINT,
    exclusao_solicitada_no_plano BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    RETURN QUERY
    WITH cnpjs_empresa AS (
        SELECT c.id, c.cnpj, c.razao_social, c.status, c.created_at, c.empresa_id
        FROM public.cnpjs c
        WHERE c.empresa_id = p_empresa_id
        ORDER BY c.created_at DESC
    ),
    planos_filtrados AS (
        SELECT dp.id as plano_id, dp.cnpj_id, dp.seguradora, dp.valor_mensal
        FROM public.dados_planos dp
        WHERE dp.tipo_seguro::TEXT = p_tipo_plano_filter
          AND dp.cnpj_id IN (SELECT ce.id FROM cnpjs_empresa ce)
    )
    SELECT
        ce.id,
        ce.cnpj,
        ce.razao_social,
        ce.status::TEXT,
        ce.created_at,
        ce.empresa_id,
        pf.plano_id,
        pf.seguradora as plano_seguradora,
        pf.valor_mensal as plano_valor_mensal,
        (SELECT COUNT(*) FROM public.funcionarios f WHERE f.cnpj_id = ce.id)::BIGINT as total_funcionarios_cnpj,
        COALESCE((SELECT COUNT(*) FROM public.planos_funcionarios p_func WHERE p_func.plano_id = pf.plano_id AND p_func.status = 'ativo'), 0)::BIGINT as ativos_no_plano,
        COALESCE((SELECT COUNT(*) FROM public.pendencias pend 
          WHERE pend.cnpj_id = ce.id 
          AND pend.status = 'pendente' 
          AND pend.tipo_plano::TEXT = p_tipo_plano_filter
        ), 0)::BIGINT as pendentes_no_plano,
        COALESCE((SELECT COUNT(*) FROM public.funcionarios f WHERE f.cnpj_id = ce.id AND f.status = 'exclusao_solicitada'), 0)::BIGINT as exclusao_solicitada_no_plano
    FROM cnpjs_empresa ce
    LEFT JOIN planos_filtrados pf ON ce.id = pf.cnpj_id;
END;
$$;

-- 3. Update get_empresas_com_planos_por_tipo to include total_pendencias
CREATE OR REPLACE FUNCTION get_empresas_com_planos_por_tipo(
    p_corretora_id UUID,
    p_tipo_seguro TEXT
)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    total_planos_ativos BIGINT,
    total_pendencias BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.nome,
        COUNT(DISTINCT p.id) FILTER (WHERE p.tipo_seguro::text = p_tipo_seguro)::BIGINT AS total_planos_ativos,
        COALESCE((
            SELECT COUNT(*)
            FROM public.pendencias pend
            JOIN public.cnpjs c2 ON pend.cnpj_id = c2.id
            WHERE c2.empresa_id = e.id
              AND pend.status = 'pendente'
              AND pend.tipo_plano::TEXT = p_tipo_seguro
        ), 0)::BIGINT AS total_pendencias
    FROM
        public.empresas e
    LEFT JOIN
        public.cnpjs c ON e.id = c.empresa_id
    LEFT JOIN
        public.dados_planos p ON c.id = p.cnpj_id
    WHERE
        e.corretora_id = p_corretora_id
    GROUP BY
        e.id, e.nome
    ORDER BY
        e.nome;
END;
$$;