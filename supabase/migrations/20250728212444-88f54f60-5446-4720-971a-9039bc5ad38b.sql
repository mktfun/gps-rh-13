
CREATE OR REPLACE FUNCTION get_relatorio_custos_empresa(
  p_empresa_id UUID,
  p_page_size INTEGER DEFAULT 10,
  p_page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  cnpj_razao_social TEXT,
  funcionario_nome TEXT,
  funcionario_cpf TEXT,
  valor_individual NUMERIC,
  status TEXT,
  total_cnpj NUMERIC,
  total_count INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH dados_com_contagem AS (
    SELECT 
      c.razao_social as cnpj_razao_social,
      f.nome as funcionario_nome,
      f.cpf as funcionario_cpf,
      0::NUMERIC as valor_individual, -- Valor individual é sempre 0 (valor é por plano)
      f.status::TEXT,
      COALESCE(dp.valor_mensal, 0) as total_cnpj, -- Valor fixo do plano por CNPJ
      COUNT(*) OVER() as total_count
    FROM cnpjs c
    INNER JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id 
      AND c.status = 'ativo'
    ORDER BY c.razao_social, f.nome
  )
  SELECT *
  FROM dados_com_contagem
  LIMIT p_page_size
  OFFSET p_page_offset;
END;
$$;
