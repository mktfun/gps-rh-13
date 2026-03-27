
-- Drop old function with different return type
DROP FUNCTION IF EXISTS public.get_funcionarios_empresa_completo(uuid, text, text, integer, integer);

-- Recreate with separate saude/vida columns
CREATE OR REPLACE FUNCTION public.get_funcionarios_empresa_completo(
  p_empresa_id uuid,
  p_search_term text DEFAULT NULL,
  p_status_filter text DEFAULT 'all',
  p_page_size integer DEFAULT 10,
  p_page_num integer DEFAULT 1
)
RETURNS TABLE(
  funcionario_id uuid,
  nome text,
  cpf text,
  cargo text,
  salario numeric,
  status text,
  idade integer,
  data_nascimento date,
  estado_civil text,
  email text,
  created_at timestamptz,
  updated_at timestamptz,
  cnpj_id uuid,
  cnpj_razao_social text,
  cnpj_numero text,
  plano_saude_seguradora text,
  plano_saude_valor numeric,
  plano_vida_seguradora text,
  plano_vida_valor numeric,
  plano_vida_cobertura_morte numeric,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_offset integer;
  v_total bigint;
BEGIN
  v_offset := (p_page_num - 1) * p_page_size;

  SELECT COUNT(DISTINCT f.id) INTO v_total
  FROM funcionarios f
  JOIN cnpjs c ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND (p_status_filter = 'all' OR f.status::text = p_status_filter)
    AND f.status NOT IN ('arquivado', 'desativado')
    AND (
      p_search_term IS NULL 
      OR f.nome ILIKE '%' || p_search_term || '%'
      OR f.cpf ILIKE '%' || p_search_term || '%'
    );

  RETURN QUERY
  SELECT
    f.id AS funcionario_id,
    f.nome,
    f.cpf,
    f.cargo,
    f.salario,
    f.status::text,
    f.idade,
    f.data_nascimento,
    f.estado_civil::text,
    f.email,
    f.created_at,
    f.updated_at,
    f.cnpj_id,
    c.razao_social AS cnpj_razao_social,
    c.cnpj AS cnpj_numero,
    ps.seguradora AS plano_saude_seguradora,
    ps.valor_mensal AS plano_saude_valor,
    pv.seguradora AS plano_vida_seguradora,
    pv.valor_mensal AS plano_vida_valor,
    pv.cobertura_morte AS plano_vida_cobertura_morte,
    v_total AS total_count
  FROM funcionarios f
  JOIN cnpjs c ON f.cnpj_id = c.id
  LEFT JOIN LATERAL (
    SELECT dp.seguradora, dp.valor_mensal
    FROM planos_funcionarios pf_s
    JOIN dados_planos dp ON dp.id = pf_s.plano_id
    WHERE pf_s.funcionario_id = f.id
      AND dp.tipo_seguro = 'saude'
      AND pf_s.status IN ('ativo', 'pendente', 'exclusao_solicitada')
    LIMIT 1
  ) ps ON true
  LEFT JOIN LATERAL (
    SELECT dp.seguradora, dp.valor_mensal, dp.cobertura_morte
    FROM planos_funcionarios pf_v
    JOIN dados_planos dp ON dp.id = pf_v.plano_id
    WHERE pf_v.funcionario_id = f.id
      AND dp.tipo_seguro = 'vida'
      AND pf_v.status IN ('ativo', 'pendente', 'exclusao_solicitada')
    LIMIT 1
  ) pv ON true
  WHERE c.empresa_id = p_empresa_id
    AND (p_status_filter = 'all' OR f.status::text = p_status_filter)
    AND f.status NOT IN ('arquivado', 'desativado')
    AND (
      p_search_term IS NULL 
      OR f.nome ILIKE '%' || p_search_term || '%'
      OR f.cpf ILIKE '%' || p_search_term || '%'
    )
  ORDER BY f.nome
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;
