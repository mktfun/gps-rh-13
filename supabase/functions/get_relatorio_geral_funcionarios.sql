
-- Função para buscar relatório geral de funcionários da corretora com filtros
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

-- Conceder permissão para authenticated users
GRANT EXECUTE ON FUNCTION get_relatorio_geral_funcionarios(uuid, uuid, text) TO authenticated;
