-- Function to get unified empresa data with both health and life insurance plans, funcionarios count, and pendencias
CREATE OR REPLACE FUNCTION public.get_empresas_unificadas(p_corretora_id uuid)
RETURNS TABLE (
    id uuid,
    nome text,
    planos_saude bigint,
    planos_vida bigint,
    funcionarios_ativos bigint,
    funcionarios_pendentes bigint,
    total_funcionarios bigint,
    pendencias_criticas bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    RETURN QUERY
    WITH empresa_stats AS (
        SELECT 
            e.id,
            e.nome,
            -- Count health plans
            COALESCE(SUM(CASE WHEN dp.tipo_seguro = 'saude' THEN 1 ELSE 0 END), 0) as planos_saude,
            -- Count life insurance plans  
            COALESCE(SUM(CASE WHEN dp.tipo_seguro = 'vida' THEN 1 ELSE 0 END), 0) as planos_vida,
            -- Count active funcionarios
            COALESCE(COUNT(CASE WHEN f.status = 'ativo' THEN 1 END), 0) as funcionarios_ativos,
            -- Count pending funcionarios
            COALESCE(COUNT(CASE WHEN f.status = 'pendente' THEN 1 END), 0) as funcionarios_pendentes,
            -- Count total funcionarios
            COALESCE(COUNT(f.id), 0) as total_funcionarios,
            -- Count critical pendencias (older than 7 days)
            COALESCE(COUNT(CASE WHEN p.status = 'pendente' AND p.data_criacao < NOW() - INTERVAL '7 days' THEN 1 END), 0) as pendencias_criticas
        FROM public.empresas e
        LEFT JOIN public.cnpjs c ON c.empresa_id = e.id
        LEFT JOIN public.dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN public.funcionarios f ON f.cnpj_id = c.id
        LEFT JOIN public.pendencias p ON p.cnpj_id = c.id
        WHERE e.corretora_id = p_corretora_id
          AND c.status = 'ativo' -- Only active CNPJs
        GROUP BY e.id, e.nome
    )
    SELECT 
        es.id,
        es.nome,
        es.planos_saude,
        es.planos_vida,
        es.funcionarios_ativos,
        es.funcionarios_pendentes,
        es.total_funcionarios,
        es.pendencias_criticas
    FROM empresa_stats es
    WHERE (es.planos_saude + es.planos_vida) > 0 -- Only empresas with plans
       OR es.funcionarios_ativos > 0 -- Or with active funcionarios
       OR es.funcionarios_pendentes > 0 -- Or with pending funcionarios
    ORDER BY es.nome;
END;
$function$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_empresas_unificadas(uuid) TO authenticated;
