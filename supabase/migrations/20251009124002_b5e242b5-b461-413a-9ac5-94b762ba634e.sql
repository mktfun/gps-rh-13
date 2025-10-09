-- =====================================================================
-- RPC DEFINITIVA: get_cnpjs_com_metricas_por_tipo
-- Retorna CNPJs com contagens corretas de funcionários filtrados por tipo de plano
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_cnpjs_com_metricas_por_tipo(
    p_empresa_id UUID,
    p_tipo_plano_filter TEXT -- 'vida' ou 'saude'
)
RETURNS TABLE (
    id UUID,
    cnpj TEXT,
    razao_social TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    empresa_id UUID,
    tem_plano BOOLEAN,
    plano_id UUID,
    seguradora TEXT,
    valor_mensal NUMERIC,
    funcionarios_ativos BIGINT,
    funcionarios_pendentes BIGINT,
    funcionarios_exclusao_solicitada BIGINT,
    total_funcionarios BIGINT,
    total_pendencias BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    WITH cnpjs_empresa AS (
        -- 1. Todos os CNPJs da empresa
        SELECT 
            c.id, 
            c.cnpj, 
            c.razao_social, 
            c.status::TEXT,
            c.created_at,
            c.empresa_id
        FROM public.cnpjs c
        WHERE c.empresa_id = p_empresa_id
    ),
    planos_filtrados AS (
        -- 2. Plano específico (vida OU saude) para cada CNPJ
        SELECT 
            dp.id as plano_id, 
            dp.cnpj_id, 
            dp.seguradora, 
            dp.valor_mensal
        FROM public.dados_planos dp
        WHERE dp.tipo_seguro::TEXT = p_tipo_plano_filter
          AND dp.cnpj_id IN (SELECT id FROM cnpjs_empresa)
    )
    -- 3. Junta tudo e calcula métricas CORRETAS
    SELECT
        ce.id,
        ce.cnpj,
        ce.razao_social,
        ce.status,
        ce.created_at,
        ce.empresa_id,
        -- Tem plano do tipo específico?
        (pf.plano_id IS NOT NULL) as tem_plano,
        pf.plano_id,
        pf.seguradora,
        pf.valor_mensal,
        -- Funcionários ATIVOS NO PLANO ESPECÍFICO (via planos_funcionarios)
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.planos_funcionarios p_func 
            WHERE p_func.plano_id = pf.plano_id 
              AND p_func.status = 'ativo'
        ), 0) as funcionarios_ativos,
        -- Funcionários PENDENTES para este CNPJ + TIPO DE PLANO (via pendencias)
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.pendencias pend 
            WHERE pend.cnpj_id = ce.id 
              AND pend.status = 'pendente' 
              AND pend.tipo = 'ativacao'
              AND pend.tipo_plano::TEXT = p_tipo_plano_filter
        ), 0) as funcionarios_pendentes,
        -- Funcionários com EXCLUSÃO SOLICITADA para este CNPJ
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.funcionarios f 
            WHERE f.cnpj_id = ce.id 
              AND f.status = 'exclusao_solicitada'
        ), 0) as funcionarios_exclusao_solicitada,
        -- Total = ativos no plano + pendentes do tipo
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.planos_funcionarios p_func 
            WHERE p_func.plano_id = pf.plano_id 
              AND p_func.status = 'ativo'
        ), 0) + COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.pendencias pend 
            WHERE pend.cnpj_id = ce.id 
              AND pend.status = 'pendente' 
              AND pend.tipo = 'ativacao'
              AND pend.tipo_plano::TEXT = p_tipo_plano_filter
        ), 0) as total_funcionarios,
        -- Total de pendências = pendentes + exclusão solicitada
        COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.pendencias pend 
            WHERE pend.cnpj_id = ce.id 
              AND pend.status = 'pendente' 
              AND pend.tipo = 'ativacao'
              AND pend.tipo_plano::TEXT = p_tipo_plano_filter
        ), 0) + COALESCE((
            SELECT COUNT(*)::BIGINT 
            FROM public.funcionarios f 
            WHERE f.cnpj_id = ce.id 
              AND f.status = 'exclusao_solicitada'
        ), 0) as total_pendencias
    FROM cnpjs_empresa ce
    LEFT JOIN planos_filtrados pf ON ce.id = pf.cnpj_id
    ORDER BY ce.razao_social;
END;
$$;