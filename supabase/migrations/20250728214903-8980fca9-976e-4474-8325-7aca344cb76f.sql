
-- Corrigir a função get_relatorio_custos_empresa para usar a coluna correta
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
  WITH dados_completos AS (
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
    WHERE c.empresa_id = p_empresa_id
    ORDER BY c.razao_social, f.nome
  ),
  dados_paginados AS (
    SELECT 
      *,
      COUNT(*) OVER() as total_count
    FROM dados_completos
    LIMIT p_page_size
    OFFSET p_page_offset
  )
  SELECT 
    dp.cnpj_razao_social,
    dp.funcionario_nome,
    dp.funcionario_cpf,
    dp.valor_individual,
    dp.status,
    dp.total_cnpj,
    dp.total_count::INTEGER
  FROM dados_paginados dp;
END;
$$;
