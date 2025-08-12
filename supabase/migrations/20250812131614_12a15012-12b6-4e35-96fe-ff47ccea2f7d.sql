
-- Corrige o tipo (ENUM vs TEXT) e retorna TODAS as empresas da corretora (inclusive sem planos)
CREATE OR REPLACE FUNCTION public.get_empresas_com_planos_por_tipo(
  p_tipo_seguro TEXT,
  p_corretora_id UUID
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  total_planos_ativos BIGINT
)
LANGUAGE sql
AS $$
  SELECT
    e.id,
    e.nome,
    COUNT(DISTINCT p.id) FILTER (WHERE p.tipo_seguro::text = p_tipo_seguro) AS total_planos_ativos
  FROM
    public.empresas e
  LEFT JOIN
    public.cnpjs c ON e.id = c.empresa_id
  LEFT JOIN
    public.dados_planos p ON c.id = p.cnpj_id
  WHERE
    e.corretora_id = p_corretora_id
  GROUP BY
    e.id, e.nome
  ORDER BY
    e.nome;
$$;
