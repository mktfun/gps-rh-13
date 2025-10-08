-- DELETA A VERSÃO ANTIGA E BURRA DA FUNÇÃO
DROP FUNCTION IF EXISTS public.get_funcionarios_por_plano(UUID, TEXT, TEXT, INT, INT);

-- CRIA A VERSÃO NOVA E INTELIGENTE QUE USA UNION ALL
CREATE OR REPLACE FUNCTION public.get_funcionarios_por_plano(
    p_plano_id UUID,
    p_status_filter TEXT DEFAULT NULL,
    p_search TEXT DEFAULT NULL,
    p_page_index INT DEFAULT 0,
    p_page_size INT DEFAULT 10
)
RETURNS TABLE (
    id UUID, 
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
    funcionario_id UUID, 
    total_count BIGINT
)
LANGUAGE plpgsql 
SECURITY INVOKER 
AS $$
DECLARE
    v_offset INT := p_page_index * p_page_size;
BEGIN
    RETURN QUERY
    WITH all_related_funcionarios AS (
        -- PARTE 1: Busca os funcionários ATIVOS e INATIVOS (quem tá na tabela de vínculo)
        SELECT
            f.id, 
            f.nome, 
            f.cpf, 
            f.data_nascimento, 
            f.cargo, 
            f.salario, 
            f.email, 
            f.cnpj_id,
            pf.status::TEXT AS status, 
            f.idade, 
            f.created_at, 
            pf.id as matricula_id
        FROM public.planos_funcionarios pf
        JOIN public.funcionarios f ON pf.funcionario_id = f.id
        WHERE pf.plano_id = p_plano_id

        UNION ALL

        -- PARTE 2: Busca os funcionários PENDENTES (quem tá na tabela de pendências)
        SELECT
            f.id, 
            f.nome, 
            f.cpf, 
            f.data_nascimento, 
            f.cargo, 
            f.salario, 
            f.email, 
            f.cnpj_id,
            p.status::TEXT AS status, 
            f.idade, 
            f.created_at, 
            NULL as matricula_id
        FROM public.pendencias p
        JOIN public.funcionarios f ON p.funcionario_id = f.id
        WHERE p.tipo = 'ativacao'
          AND p.status = 'pendente'
          AND p.cnpj_id = (SELECT dp.cnpj_id FROM public.dados_planos dp WHERE dp.id = p_plano_id)
          AND p.tipo_plano = (SELECT dp.tipo_seguro FROM public.dados_planos dp WHERE dp.id = p_plano_id)
    ),
    filtered_and_counted AS (
        SELECT 
            *, 
            COUNT(*) OVER() as total_records
        FROM all_related_funcionarios arf
        WHERE (p_status_filter IS NULL OR p_status_filter = 'todos' OR
               (p_status_filter = 'pendentes' AND arf.status IN ('pendente', 'exclusao_solicitada')) OR
               (p_status_filter != 'pendentes' AND arf.status = p_status_filter))
          AND (p_search IS NULL OR p_search = '' OR
               arf.nome ILIKE '%' || p_search || '%' OR
               arf.cpf ILIKE '%' || p_search || '%' OR
               arf.email ILIKE '%' || p_search || '%')
    )
    SELECT
        fic.id, 
        fic.nome, 
        fic.cpf, 
        fic.data_nascimento, 
        fic.cargo, 
        fic.salario, 
        fic.email, 
        fic.cnpj_id,
        fic.status, 
        fic.idade, 
        fic.created_at, 
        fic.matricula_id, 
        fic.id as funcionario_id,
        fic.total_records as total_count
    FROM filtered_and_counted fic
    ORDER BY fic.nome
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;