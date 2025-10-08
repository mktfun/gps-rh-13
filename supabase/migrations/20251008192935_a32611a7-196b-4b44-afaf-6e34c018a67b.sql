-- Função para buscar a lista detalhada de funcionários de um plano
-- Respeita a RLS da corretora porque usa SECURITY INVOKER.
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
    created_at TIMESTAMP WITH TIME ZONE,
    matricula_id UUID,
    funcionario_id UUID,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    v_offset INT;
    v_total_count BIGINT;
BEGIN
    -- Calcular offset
    v_offset := p_page_index * p_page_size;
    
    -- Contar total de registros primeiro
    SELECT COUNT(DISTINCT pf.id) INTO v_total_count
    FROM public.planos_funcionarios pf
    JOIN public.funcionarios f ON pf.funcionario_id = f.id
    WHERE pf.plano_id = p_plano_id
        AND (p_status_filter IS NULL OR p_status_filter = 'todos' OR 
             (p_status_filter = 'pendentes' AND pf.status IN ('pendente', 'exclusao_solicitada')) OR
             (p_status_filter != 'pendentes' AND pf.status::TEXT = p_status_filter))
        AND (p_search IS NULL OR p_search = '' OR 
             f.nome ILIKE '%' || p_search || '%' OR 
             f.cpf ILIKE '%' || p_search || '%' OR 
             f.email ILIKE '%' || p_search || '%');
    
    -- Retornar dados paginados
    RETURN QUERY
    SELECT
        f.id,
        f.nome,
        f.cpf,
        f.data_nascimento,
        f.cargo,
        f.salario,
        f.email,
        f.cnpj_id,
        pf.status::TEXT,
        f.idade,
        f.created_at,
        pf.id as matricula_id,
        f.id as funcionario_id,
        v_total_count
    FROM public.planos_funcionarios pf
    JOIN public.funcionarios f ON pf.funcionario_id = f.id
    WHERE pf.plano_id = p_plano_id
        AND (p_status_filter IS NULL OR p_status_filter = 'todos' OR 
             (p_status_filter = 'pendentes' AND pf.status IN ('pendente', 'exclusao_solicitada')) OR
             (p_status_filter != 'pendentes' AND pf.status::TEXT = p_status_filter))
        AND (p_search IS NULL OR p_search = '' OR 
             f.nome ILIKE '%' || p_search || '%' OR 
             f.cpf ILIKE '%' || p_search || '%' OR 
             f.email ILIKE '%' || p_search || '%')
    ORDER BY f.nome
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;