
-- Criar função RPC para buscar planos com métricas unificadas
CREATE OR REPLACE FUNCTION public.get_empresa_planos_unificados(p_empresa_id uuid)
RETURNS TABLE (
  plano_id uuid,
  cnpj_id uuid,
  seguradora text,
  valor_unitario numeric,
  cobertura_morte numeric,
  cobertura_morte_acidental numeric,
  cobertura_invalidez_acidente numeric,
  cobertura_auxilio_funeral numeric,
  cnpj_numero text,
  cnpj_razao_social text,
  funcionarios_ativos bigint,
  funcionarios_pendentes bigint,
  total_funcionarios bigint,
  custo_mensal_real numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dp.id as plano_id,
    dp.cnpj_id,
    dp.seguradora,
    dp.valor_mensal as valor_unitario,
    dp.cobertura_morte,
    dp.cobertura_morte_acidental,
    dp.cobertura_invalidez_acidente,
    dp.cobertura_auxilio_funeral,
    c.cnpj as cnpj_numero,
    c.razao_social as cnpj_razao_social,
    COUNT(f.id) FILTER (WHERE f.status = 'ativo') as funcionarios_ativos,
    COUNT(f.id) FILTER (WHERE f.status = 'pendente') as funcionarios_pendentes,
    COUNT(f.id) FILTER (WHERE f.status IN ('ativo', 'pendente')) as total_funcionarios,
    dp.valor_mensal as custo_mensal_real
  FROM dados_planos dp
  JOIN cnpjs c ON dp.cnpj_id = c.id
  LEFT JOIN funcionarios f ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
  GROUP BY dp.id, dp.cnpj_id, dp.seguradora, dp.valor_mensal, dp.cobertura_morte, 
           dp.cobertura_morte_acidental, dp.cobertura_invalidez_acidente, 
           dp.cobertura_auxilio_funeral, c.cnpj, c.razao_social
  ORDER BY c.razao_social;
END;
$$;
