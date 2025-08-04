
CREATE OR REPLACE FUNCTION get_relatorio_funcionarios_empresa(
  p_empresa_id UUID,
  p_cnpj_id UUID DEFAULT NULL
)
RETURNS TABLE (
  funcionario_id UUID,
  nome TEXT,
  cpf TEXT,
  cargo TEXT,
  salario NUMERIC,
  status TEXT,
  cnpj_razao_social TEXT,
  data_contratacao DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.id as funcionario_id,
    f.nome,
    f.cpf,
    f.cargo,
    f.salario,
    f.status,
    c.razao_social as cnpj_razao_social,
    f.data_contratacao
  FROM funcionarios f
  INNER JOIN cnpjs c ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND (p_cnpj_id IS NULL OR f.cnpj_id = p_cnpj_id)
  ORDER BY c.razao_social, f.nome;
END;
$$;
