
-- Corrigir a função get_relatorio_custos_empresa para incluir totais globais
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
  total_count BIGINT,
  total_funcionarios_ativos BIGINT,
  total_cnpjs_com_plano BIGINT,
  total_geral NUMERIC,
  custo_medio_por_cnpj NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_funcionarios_ativos BIGINT;
  v_total_cnpjs_com_plano BIGINT;
  v_total_geral NUMERIC;
  v_custo_medio_por_cnpj NUMERIC;
  v_total_count BIGINT;
BEGIN
  -- Calcular totais globais uma vez
  SELECT 
    COUNT(DISTINCT f.id) FILTER (WHERE f.status = 'ativo'),
    COUNT(DISTINCT c.id) FILTER (WHERE dp.id IS NOT NULL),
    COALESCE(SUM(DISTINCT dp.valor_mensal), 0),
    CASE 
      WHEN COUNT(DISTINCT c.id) FILTER (WHERE dp.id IS NOT NULL) > 0 
      THEN COALESCE(SUM(DISTINCT dp.valor_mensal), 0) / COUNT(DISTINCT c.id) FILTER (WHERE dp.id IS NOT NULL)
      ELSE 0 
    END
  INTO 
    v_total_funcionarios_ativos,
    v_total_cnpjs_com_plano,
    v_total_geral,
    v_custo_medio_por_cnpj
  FROM cnpjs c
  LEFT JOIN funcionarios f ON f.cnpj_id = c.id
  LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id;

  -- Contar total de registros paginados
  SELECT COUNT(*)
  INTO v_total_count
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id;

  -- Retornar dados paginados com totais globais
  RETURN QUERY
  SELECT 
    c.razao_social as cnpj_razao_social,
    f.nome as funcionario_nome,
    f.cpf as funcionario_cpf,
    COALESCE(dp.valor_mensal, 0) as valor_individual,
    f.status::TEXT,
    COALESCE(dp.valor_mensal, 0) as total_cnpj,
    v_total_count as total_count,
    v_total_funcionarios_ativos as total_funcionarios_ativos,
    v_total_cnpjs_com_plano as total_cnpjs_com_plano,
    v_total_geral as total_geral,
    v_custo_medio_por_cnpj as custo_medio_por_cnpj
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
  ORDER BY c.razao_social, f.nome
  LIMIT p_page_size OFFSET p_page_offset;
END;
$$;
