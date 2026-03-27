CREATE OR REPLACE FUNCTION public.get_funcionarios_por_plano(
    p_plano_id UUID,
    p_status_filter TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_page_index INT DEFAULT 0,
    p_page_size INT DEFAULT 10
)
RETURNS TABLE (
    funcionario_id UUID,
    nome TEXT,
    cpf TEXT,
    data_nascimento DATE,
    cargo TEXT,
    salario NUMERIC,
    email TEXT,
    cnpj_id UUID,
    status TEXT,
    idade INT,
    created_at TIMESTAMPTZ,
    matricula_id UUID,
    custo_individual NUMERIC,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_offset INT := p_page_index * p_page_size;
    v_tipo_seguro tipo_seguro;
BEGIN
    SELECT dp.tipo_seguro INTO v_tipo_seguro
    FROM dados_planos dp WHERE dp.id = p_plano_id;

    RETURN QUERY
    WITH all_related_funcionarios AS (
        SELECT f.id as func_id, f.nome, f.cpf, f.data_nascimento, f.cargo, f.salario, f.email, f.cnpj_id,
            pf.status::TEXT AS status, f.idade, f.created_at, pf.id as matricula_id,
            CASE WHEN v_tipo_seguro = 'saude' THEN
                (SELECT pfp.valor FROM planos_faixas_de_preco pfp WHERE pfp.plano_id = p_plano_id AND f.idade BETWEEN pfp.faixa_inicio AND pfp.faixa_fim LIMIT 1)
              ELSE 0 END as custo_individual
        FROM planos_funcionarios pf JOIN funcionarios f ON pf.funcionario_id = f.id
        WHERE pf.plano_id = p_plano_id
        UNION ALL
        SELECT f.id as func_id, f.nome, f.cpf, f.data_nascimento, f.cargo, f.salario, f.email, f.cnpj_id,
            p.status::TEXT AS status, f.idade, f.created_at, NULL as matricula_id,
            CASE WHEN v_tipo_seguro = 'saude' THEN
                (SELECT pfp.valor FROM planos_faixas_de_preco pfp WHERE pfp.plano_id = p_plano_id AND f.idade BETWEEN pfp.faixa_inicio AND pfp.faixa_fim LIMIT 1)
              ELSE 0 END as custo_individual
        FROM pendencias p JOIN funcionarios f ON p.funcionario_id = f.id
        WHERE p.tipo = 'ativacao' AND p.status = 'pendente'
          AND p.cnpj_id = (SELECT dp.cnpj_id FROM dados_planos dp WHERE dp.id = p_plano_id)
          AND p.tipo_plano::text = (SELECT dp.tipo_seguro::text FROM dados_planos dp WHERE dp.id = p_plano_id)
    ),
    filtered_and_counted AS (
        SELECT *, COUNT(*) OVER() as total_records
        FROM all_related_funcionarios arf
        WHERE (p_status_filter IS NULL OR p_status_filter = 'todos' OR
               (p_status_filter = 'pendentes' AND arf.status IN ('pendente', 'exclusao_solicitada')) OR
               (p_status_filter != 'pendentes' AND arf.status = p_status_filter))
          AND (p_search IS NULL OR p_search = '' OR
               arf.nome ILIKE '%' || p_search || '%' OR arf.cpf ILIKE '%' || p_search || '%' OR arf.email ILIKE '%' || p_search || '%')
    )
    SELECT fic.func_id, fic.nome, fic.cpf, fic.data_nascimento, fic.cargo, fic.salario,
        fic.email, fic.cnpj_id, fic.status, fic.idade, fic.created_at, fic.matricula_id,
        fic.custo_individual, fic.total_records as total_count
    FROM filtered_and_counted fic ORDER BY fic.nome LIMIT p_page_size OFFSET v_offset;
END;
$$;