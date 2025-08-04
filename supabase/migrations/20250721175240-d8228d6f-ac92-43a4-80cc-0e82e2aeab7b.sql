
-- Função 1: Relatório Financeiro da Corretora
CREATE OR REPLACE FUNCTION get_relatorio_financeiro_corretora(p_corretora_id uuid)
RETURNS TABLE (
    empresa_id uuid,
    empresa_nome text,
    total_cnpjs_ativos bigint,
    total_funcionarios_segurados bigint,
    custo_total_mensal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as empresa_id,
        e.nome as empresa_nome,
        COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) as total_cnpjs_ativos,
        COUNT(DISTINCT CASE WHEN f.status IN ('ativo', 'pendente') THEN f.id END) as total_funcionarios_segurados,
        COALESCE(SUM(CASE WHEN c.status = 'ativo' THEN dp.valor_mensal ELSE 0 END), 0) as custo_total_mensal
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = p_corretora_id
    GROUP BY e.id, e.nome
    HAVING COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) > 0
    ORDER BY custo_total_mensal DESC;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_relatorio_financeiro_corretora(uuid) TO authenticated;

-- Função 2: Relatório Geral de Funcionários
CREATE OR REPLACE FUNCTION get_relatorio_geral_funcionarios(
    p_corretora_id uuid,
    p_empresa_id uuid DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS TABLE (
    funcionario_id uuid,
    funcionario_nome text,
    funcionario_cpf text,
    funcionario_cargo text,
    funcionario_salario numeric,
    funcionario_status text,
    funcionario_data_contratacao timestamp with time zone,
    empresa_nome text,
    cnpj_razao_social text,
    cnpj_numero text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id as funcionario_id,
        f.nome as funcionario_nome,
        f.cpf as funcionario_cpf,
        f.cargo as funcionario_cargo,
        f.salario as funcionario_salario,
        f.status as funcionario_status,
        f.created_at as funcionario_data_contratacao,
        e.nome as empresa_nome,
        c.razao_social as cnpj_razao_social,
        c.cnpj as cnpj_numero
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND (p_empresa_id IS NULL OR e.id = p_empresa_id)
    AND (p_status IS NULL OR f.status = p_status)
    ORDER BY e.nome, c.razao_social, f.nome;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_relatorio_geral_funcionarios(uuid, uuid, text) TO authenticated;

-- Função 3: Relatório de Movimentação da Corretora
CREATE OR REPLACE FUNCTION get_relatorio_movimentacao_corretora(
    p_corretora_id uuid,
    p_data_inicio date,
    p_data_fim date
)
RETURNS TABLE (
    mes text,
    inclusoes bigint,  
    exclusoes bigint,
    saldo bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Validação do período (máximo 2 anos)
    IF p_data_fim - p_data_inicio > INTERVAL '2 years' THEN
        RAISE EXCEPTION 'Período não pode ser superior a 2 anos';
    END IF;

    RETURN QUERY
    WITH meses_periodo AS (
        SELECT 
            TO_CHAR(generate_series(
                DATE_TRUNC('month', p_data_inicio),
                DATE_TRUNC('month', p_data_fim),
                INTERVAL '1 month'
            ), 'YYYY-MM') as mes_ref
    ),
    inclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_inclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND DATE(f.created_at) BETWEEN p_data_inicio AND p_data_fim
            AND f.status = 'ativo'
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM')
    ),
    exclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_exclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND f.data_exclusao IS NOT NULL
            AND DATE(f.data_exclusao) BETWEEN p_data_inicio AND p_data_fim
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM')
    )
    SELECT 
        mp.mes_ref as mes,
        COALESCE(im.total_inclusoes, 0) as inclusoes,
        COALESCE(em.total_exclusoes, 0) as exclusoes,
        COALESCE(im.total_inclusoes, 0) - COALESCE(em.total_exclusoes, 0) as saldo
    FROM meses_periodo mp
    LEFT JOIN inclusoes_mes im ON mp.mes_ref = im.mes_ref
    LEFT JOIN exclusoes_mes em ON mp.mes_ref = em.mes_ref
    ORDER BY mp.mes_ref;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_relatorio_movimentacao_corretora(uuid, date, date) TO authenticated;
