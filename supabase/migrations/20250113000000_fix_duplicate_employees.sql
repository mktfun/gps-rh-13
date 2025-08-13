-- Fix duplicate employee records in get_funcionarios_empresa_completo
-- The issue is caused by LEFT JOIN with dados_planos table that can have multiple records per CNPJ
-- This causes each employee to appear multiple times if their CNPJ has multiple plans

CREATE OR REPLACE FUNCTION get_funcionarios_empresa_completo(
    p_empresa_id UUID,
    p_search_term TEXT DEFAULT NULL,
    p_status_filter TEXT DEFAULT 'all',
    p_page_size INT DEFAULT 10,
    p_page_num INT DEFAULT 1
)
RETURNS TABLE (
    funcionario_id UUID,
    nome TEXT,
    cpf TEXT,
    cargo TEXT,
    salario NUMERIC,
    status TEXT,
    idade INTEGER,
    data_nascimento DATE,
    estado_civil TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    cnpj_id UUID,
    cnpj_razao_social TEXT,
    cnpj_numero TEXT,
    plano_seguradora TEXT,
    plano_valor_mensal NUMERIC,
    plano_cobertura_morte NUMERIC,
    total_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_count INTEGER;
    v_offset INTEGER;
BEGIN
    -- Calcular offset
    v_offset := (p_page_num - 1) * p_page_size;
    
    -- Primeiro, contar o total de registros (apenas funcionários únicos)
    SELECT COUNT(DISTINCT f.id) INTO v_total_count
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             f.nome ILIKE '%' || p_search_term || '%' OR 
             f.cpf ILIKE '%' || p_search_term || '%')
        AND (p_status_filter = 'all' OR f.status::TEXT = p_status_filter);
    
    -- Se não há registros, retornar vazio
    IF v_total_count = 0 THEN
        RETURN;
    END IF;
    
    -- Se o offset é maior que o total, ajustar para a última página válida
    IF v_offset >= v_total_count THEN
        v_offset := GREATEST(0, ((v_total_count - 1) / p_page_size) * p_page_size);
    END IF;
    
    -- Retornar dados paginados sem duplicatas
    -- Use DISTINCT ON para garantir um funcionário por linha
    RETURN QUERY
    SELECT DISTINCT ON (f.id)
        f.id as funcionario_id,
        f.nome,
        f.cpf,
        f.cargo,
        f.salario,
        f.status::TEXT,
        f.idade,
        f.data_nascimento,
        f.estado_civil::TEXT,
        f.email,
        f.created_at,
        f.updated_at,
        f.cnpj_id,
        c.razao_social as cnpj_razao_social,
        c.cnpj as cnpj_numero,
        dp.seguradora as plano_seguradora,
        dp.valor_mensal as plano_valor_mensal,
        dp.cobertura_morte as plano_cobertura_morte,
        v_total_count as total_count
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             f.nome ILIKE '%' || p_search_term || '%' OR 
             f.cpf ILIKE '%' || p_search_term || '%')
        AND (p_status_filter = 'all' OR f.status::TEXT = p_status_filter)
    ORDER BY f.id, c.razao_social, f.nome, dp.created_at DESC
    LIMIT p_page_size
    OFFSET v_offset;
END;
$$;
