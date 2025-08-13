-- Fix data type mismatch in get_relatorio_funcionarios_empresa function
-- The COUNT(*) OVER() returns BIGINT but function signature expects INTEGER

CREATE OR REPLACE FUNCTION get_relatorio_funcionarios_empresa(
  p_empresa_id UUID,
  p_cnpj_id UUID DEFAULT NULL,
  p_page_size INTEGER DEFAULT 10,
  p_page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  funcionario_id UUID,
  nome TEXT,
  cpf TEXT,
  cargo TEXT,
  salario NUMERIC,
  status TEXT,
  cnpj_razao_social TEXT,
  data_contratacao DATE,
  total_count BIGINT  -- Changed from INTEGER to BIGINT to match COUNT(*) OVER() return type
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dados_com_contagem AS (
    SELECT 
      f.id as funcionario_id,
      f.nome,
      f.cpf,
      f.cargo,
      f.salario,
      f.status::TEXT,
      c.razao_social as cnpj_razao_social,
      f.created_at::DATE as data_contratacao,
      COUNT(*) OVER() as total_count
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND (p_cnpj_id IS NULL OR f.cnpj_id = p_cnpj_id)
    ORDER BY c.razao_social, f.nome
  )
  SELECT *
  FROM dados_com_contagem
  LIMIT p_page_size
  OFFSET p_page_offset;
END;
$$;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION get_relatorio_funcionarios_empresa(UUID, UUID, INTEGER, INTEGER) TO authenticated;
