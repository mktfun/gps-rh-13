
-- 1. Corrigir a função get_relatorio_custos_empresa para contar apenas CNPJs ativos
-- e usar valor_mensal corretamente
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
  WITH custos_por_cnpj AS (
    SELECT 
      c.razao_social,
      COALESCE(dp.valor_mensal, 0) as total_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id 
      AND c.status = 'ativo'
  ),
  dados_com_contagem AS (
    SELECT 
      c.razao_social as cnpj_razao_social,
      f.nome as funcionario_nome,
      f.cpf as funcionario_cpf,
      COALESCE(dp.valor_mensal, 0) as valor_individual,
      f.status::TEXT,
      cpc.total_por_cnpj as total_cnpj,
      COUNT(*) OVER() as total_count
    FROM cnpjs c
    INNER JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    INNER JOIN custos_por_cnpj cpc ON cpc.razao_social = c.razao_social
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

-- 2. Atualizar a função get_relatorio_funcionarios_empresa para suportar paginação
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
  total_count INTEGER
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
