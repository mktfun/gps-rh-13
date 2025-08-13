-- Corrigir a função get_relatorio_custos_empresa para eliminar duplicações e calcular valores corretos
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

  -- Contar total de registros únicos de funcionários (não duplicados)
  SELECT COUNT(DISTINCT f.id)
  INTO v_total_count
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id;

  -- Retornar dados paginados com valores corretos
  RETURN QUERY
  WITH funcionarios_com_dados AS (
    SELECT DISTINCT
      c.id as cnpj_id,
      c.razao_social,
      c.cnpj,
      f.id as funcionario_id,
      f.nome as funcionario_nome,
      f.cpf as funcionario_cpf,
      f.status,
      COALESCE(dp.valor_mensal, 0) as valor_plano_total,
      -- Calcular quantos funcionários ativos existem neste CNPJ
      COUNT(f2.id) FILTER (WHERE f2.status = 'ativo') OVER (PARTITION BY c.id) as funcionarios_ativos_cnpj
    FROM cnpjs c
    INNER JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN funcionarios f2 ON f2.cnpj_id = c.id -- Para contar funcionários ativos
    WHERE c.empresa_id = p_empresa_id
    ORDER BY c.razao_social, f.nome
  )
  SELECT 
    fcd.razao_social as cnpj_razao_social,
    fcd.funcionario_nome,
    fcd.funcionario_cpf,
    -- Valor individual = valor do plano dividido pelo número de funcionários ativos do CNPJ
    CASE 
      WHEN fcd.funcionarios_ativos_cnpj > 0 AND fcd.status = 'ativo'
      THEN fcd.valor_plano_total / fcd.funcionarios_ativos_cnpj
      ELSE 0
    END as valor_individual,
    fcd.status::TEXT,
    fcd.valor_plano_total as total_cnpj, -- Total do plano para o CNPJ
    v_total_count as total_count,
    v_total_funcionarios_ativos as total_funcionarios_ativos,
    v_total_cnpjs_com_plano as total_cnpjs_com_plano,
    v_total_geral as total_geral,
    v_custo_medio_por_cnpj as custo_medio_por_cnpj
  FROM funcionarios_com_dados fcd
  LIMIT p_page_size OFFSET p_page_offset;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION get_relatorio_custos_empresa(UUID, INTEGER, INTEGER) TO authenticated;
