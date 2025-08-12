
-- Substitui a função para suportar paginação e retornar totais globais
-- 1) Remove a versão antiga (assinatura antiga)
DROP FUNCTION IF EXISTS public.get_relatorio_custos_empresa(uuid);

-- 2) Cria a nova função com paginação e totais globais
CREATE OR REPLACE FUNCTION public.get_relatorio_custos_empresa(
  p_empresa_id uuid,
  p_page_size integer DEFAULT NULL,
  p_page_offset integer DEFAULT 0
)
RETURNS TABLE (
  cnpj_razao_social        text,
  funcionario_nome         text,
  funcionario_cpf          text,
  valor_individual         numeric,
  status                   text,
  total_cnpj               numeric,
  -- campos de totais globais (mesmos valores repetidos em todas as linhas)
  total_count              bigint,
  total_funcionarios_ativos bigint,
  total_cnpjs_com_plano    bigint,
  total_geral              numeric,
  custo_medio_por_cnpj     numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH base AS (
    SELECT 
      c.id AS cnpj_id,
      c.razao_social,
      f.nome AS funcionario_nome,
      f.cpf AS funcionario_cpf,
      COALESCE(dp.valor_mensal, 0) AS valor_individual,
      f.status::text AS status
    FROM cnpjs c
    JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
  ),
  -- um valor por CNPJ (valor do plano)
  planos_por_cnpj AS (
    SELECT 
      b.cnpj_id,
      b.razao_social,
      COALESCE(MAX(b.valor_individual), 0) AS valor_plano
    FROM base b
    GROUP BY b.cnpj_id, b.razao_social
  ),
  totals AS (
    SELECT 
      (SELECT COUNT(*) FROM base)                                                 AS total_count_rows,
      (SELECT COUNT(*) FROM base WHERE status = 'ativo')                          AS total_funcionarios_ativos,
      (SELECT COUNT(*) FROM planos_por_cnpj WHERE valor_plano > 0)               AS total_cnpjs_com_plano,
      (SELECT COALESCE(SUM(valor_plano), 0) FROM planos_por_cnpj)                 AS total_geral,
      (SELECT CASE WHEN COUNT(*) = 0 
                   THEN 0::numeric 
                   ELSE ROUND(SUM(valor_plano)::numeric / NULLIF(COUNT(*),0), 2) 
              END 
       FROM planos_por_cnpj)                                                      AS custo_medio_por_cnpj
  )
  SELECT 
    b.razao_social                         AS cnpj_razao_social,
    b.funcionario_nome,
    b.funcionario_cpf,
    b.valor_individual,
    b.status,
    ppc.valor_plano                        AS total_cnpj,
    t.total_count_rows                     AS total_count,
    t.total_funcionarios_ativos,
    t.total_cnpjs_com_plano,
    t.total_geral,
    t.custo_medio_por_cnpj
  FROM base b
  JOIN planos_por_cnpj ppc ON ppc.cnpj_id = b.cnpj_id
  CROSS JOIN totals t
  ORDER BY b.razao_social, b.funcionario_nome
  OFFSET COALESCE(p_page_offset, 0)
  LIMIT CASE WHEN p_page_size IS NULL OR p_page_size <= 0 THEN NULL ELSE p_page_size END;
END;
$$;

-- Concede permissão de execução para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_relatorio_custos_empresa(uuid, integer, integer) TO authenticated;
