-- Atualizar a função get_relatorio_custos_empresa para incluir planos de saúde junto com seguros de vida
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
  -- Calcular totais globais incluindo tanto seguros de vida quanto planos de saúde
  WITH dados_agregados AS (
    SELECT 
      COUNT(DISTINCT CASE WHEN f.status = 'ativo' THEN f.id END) as funcionarios_ativos,
      COUNT(DISTINCT CASE WHEN dp.valor_mensal > 0 THEN c.id END) as cnpjs_com_plano,
      SUM(DISTINCT CASE WHEN dp.valor_mensal > 0 THEN dp.valor_mensal ELSE 0 END) as total_planos
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND (dp.tipo_seguro IN ('vida', 'saude') OR dp.tipo_seguro IS NULL)
  )
  SELECT 
    funcionarios_ativos,
    cnpjs_com_plano,
    total_planos,
    CASE 
      WHEN cnpjs_com_plano > 0 
      THEN total_planos / cnpjs_com_plano
      ELSE 0 
    END
  INTO 
    v_total_funcionarios_ativos,
    v_total_cnpjs_com_plano,
    v_total_geral,
    v_custo_medio_por_cnpj
  FROM dados_agregados;

  -- Contar total de funcionários únicos para paginação
  SELECT COUNT(DISTINCT f.id)
  INTO v_total_count
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id;

  -- Retornar dados paginados com valores corretos (incluindo ambos os tipos de plano)
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
      -- Somar valores de planos de vida E saúde para este CNPJ
      COALESCE((
        SELECT SUM(dp.valor_mensal) 
        FROM dados_planos dp 
        WHERE dp.cnpj_id = c.id 
        AND dp.tipo_seguro IN ('vida', 'saude')
        AND dp.valor_mensal > 0
      ), 0) as valor_plano_total,
      -- Contar funcionários ativos neste CNPJ
      (SELECT COUNT(*) FROM funcionarios f2 WHERE f2.cnpj_id = c.id AND f2.status = 'ativo') as funcionarios_ativos_cnpj
    FROM cnpjs c
    INNER JOIN funcionarios f ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    ORDER BY c.razao_social, f.nome
  )
  SELECT 
    fcd.razao_social as cnpj_razao_social,
    fcd.funcionario_nome,
    fcd.funcionario_cpf,
    -- Valor individual = soma dos planos (vida + saúde) dividido pelo número de funcionários ativos do CNPJ
    CASE 
      WHEN fcd.funcionarios_ativos_cnpj > 0 AND fcd.status = 'ativo' AND fcd.valor_plano_total > 0
      THEN ROUND(fcd.valor_plano_total / fcd.funcionarios_ativos_cnpj, 2)
      ELSE 0
    END as valor_individual,
    fcd.status::TEXT,
    fcd.valor_plano_total as total_cnpj, -- Total dos planos (vida + saúde) para o CNPJ
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
