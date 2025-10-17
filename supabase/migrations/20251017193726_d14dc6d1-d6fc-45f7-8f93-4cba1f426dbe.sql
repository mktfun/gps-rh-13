-- Drop e recriar a função get_funcionarios_por_plano corrigindo a ambiguidade do "id"
DROP FUNCTION IF EXISTS public.get_funcionarios_por_plano(uuid, text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.get_funcionarios_por_plano(
    p_plano_id uuid, 
    p_status_filter text DEFAULT NULL::text, 
    p_search text DEFAULT NULL::text, 
    p_page_index integer DEFAULT 0, 
    p_page_size integer DEFAULT 10
)
RETURNS TABLE(
    funcionario_id uuid,
    nome text,
    cpf text,
    data_nascimento date,
    cargo text,
    salario numeric,
    email text,
    cnpj_id uuid,
    status text,
    idade integer,
    created_at timestamp with time zone,
    matricula_id uuid,
    custo_individual numeric,
    total_count bigint
)
LANGUAGE plpgsql
AS $function$
DECLARE
    v_offset INT := p_page_index * p_page_size;
    v_tipo_seguro tipo_seguro;
BEGIN
    -- Buscar tipo do seguro
    SELECT tipo_seguro INTO v_tipo_seguro
    FROM dados_planos
    WHERE id = p_plano_id;

    RETURN QUERY
    WITH all_related_funcionarios AS (
        -- PARTE 1: Busca os funcionários ATIVOS e INATIVOS
        SELECT
            f.id as func_id, f.nome, f.cpf, f.data_nascimento, f.cargo, f.salario, f.email, f.cnpj_id,
            pf.status::TEXT AS status, f.idade, f.created_at, pf.id as matricula_id,
            -- Calcular custo individual baseado na faixa etária (apenas para saúde)
            CASE 
              WHEN v_tipo_seguro = 'saude' THEN
                (SELECT valor 
                 FROM planos_faixas_de_preco pfp
                 WHERE pfp.plano_id = p_plano_id
                   AND f.idade BETWEEN pfp.faixa_inicio AND pfp.faixa_fim
                 LIMIT 1)
              ELSE 0
            END as custo_individual
        FROM public.planos_funcionarios pf
        JOIN public.funcionarios f ON pf.funcionario_id = f.id
        WHERE pf.plano_id = p_plano_id

        UNION ALL

        -- PARTE 2: Busca os funcionários PENDENTES
        SELECT
            f.id as func_id, f.nome, f.cpf, f.data_nascimento, f.cargo, f.salario, f.email, f.cnpj_id,
            p.status::TEXT AS status, f.idade, f.created_at, NULL as matricula_id,
            -- Calcular custo individual baseado na faixa etária (apenas para saúde)
            CASE 
              WHEN v_tipo_seguro = 'saude' THEN
                (SELECT valor 
                 FROM planos_faixas_de_preco pfp
                 WHERE pfp.plano_id = p_plano_id
                   AND f.idade BETWEEN pfp.faixa_inicio AND pfp.faixa_fim
                 LIMIT 1)
              ELSE 0
            END as custo_individual
        FROM public.pendencias p
        JOIN public.funcionarios f ON p.funcionario_id = f.id
        WHERE p.tipo = 'ativacao'
          AND p.status = 'pendente'
          AND p.cnpj_id = (SELECT dp.cnpj_id FROM public.dados_planos dp WHERE dp.id = p_plano_id)
          AND p.tipo_plano::text = (SELECT dp.tipo_seguro::text FROM public.dados_planos dp WHERE dp.id = p_plano_id)
    ),
    filtered_and_counted AS (
        SELECT *, COUNT(*) OVER() as total_records
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
        fic.func_id as funcionario_id,
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
        fic.custo_individual,
        fic.total_records as total_count
    FROM filtered_and_counted fic
    ORDER BY fic.nome
    LIMIT p_page_size
    OFFSET v_offset;
END;
$function$;