
CREATE OR REPLACE FUNCTION get_relatorio_custos_empresa(
  p_empresa_id UUID
)
RETURNS TABLE (
  cnpj_razao_social TEXT,
  funcionario_nome TEXT,
  funcionario_cpf TEXT,
  valor_individual NUMERIC,
  status TEXT,
  total_cnpj NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH custos_por_cnpj AS (
    SELECT 
      c.razao_social,
      dp.valor_mensal as total_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
  )
  SELECT 
    c.razao_social as cnpj_razao_social,
    f.nome as funcionario_nome,
    f.cpf as funcionario_cpf,
    COALESCE(dp.valor_mensal, 0) as valor_individual,
    f.status::TEXT,
    COALESCE(dp.valor_mensal, 0) as total_cnpj
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
  INNER JOIN custos_por_cnpj cpc ON cpc.razao_social = c.razao_social
  WHERE c.empresa_id = p_empresa_id
  ORDER BY c.razao_social, f.nome;
END;
$$;
