
CREATE OR REPLACE FUNCTION get_planos_por_empresa(p_empresa_id UUID)
RETURNS TABLE (
    id UUID,
    seguradora TEXT,
    valor_mensal NUMERIC,
    cobertura_morte NUMERIC,
    cobertura_morte_acidental NUMERIC,
    cobertura_invalidez_acidente NUMERIC,
    cobertura_auxilio_funeral NUMERIC,
    cnpj_id UUID,
    cnpj_numero TEXT,
    cnpj_razao_social TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
    SELECT
      dp.id,
      dp.seguradora,
      dp.valor_mensal,
      dp.cobertura_morte,
      dp.cobertura_morte_acidental,
      dp.cobertura_invalidez_acidente,
      dp.cobertura_auxilio_funeral,
      c.id as cnpj_id,
      c.cnpj as cnpj_numero,
      c.razao_social as cnpj_razao_social
    FROM
      public.dados_planos dp
    JOIN
      public.cnpjs c ON dp.cnpj_id = c.id
    WHERE
      c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY c.razao_social, dp.seguradora;
END;
$$;
