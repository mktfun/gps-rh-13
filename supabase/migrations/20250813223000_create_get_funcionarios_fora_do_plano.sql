-- Create the missing get_funcionarios_fora_do_plano function
-- This function returns employees from a CNPJ who are NOT already assigned to a specific plan

CREATE OR REPLACE FUNCTION public.get_funcionarios_fora_do_plano(
  p_plano_id UUID,
  p_cnpj_id UUID
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  cpf TEXT,
  cargo TEXT,
  salario NUMERIC,
  idade INTEGER,
  status TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    f.id,
    f.nome,
    f.cpf,
    f.cargo,
    f.salario,
    f.idade,
    f.status
  FROM funcionarios f
  WHERE f.cnpj_id = p_cnpj_id
    AND f.status = 'ativo'  -- Only active employees
    AND NOT EXISTS (
      -- Exclude employees already assigned to this specific plan
      SELECT 1 
      FROM planos_funcionarios pf 
      WHERE pf.funcionario_id = f.id 
        AND pf.plano_id = p_plano_id
        AND pf.status IN ('ativo', 'pendente')  -- Don't exclude if inactive
    )
  ORDER BY f.nome;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_funcionarios_fora_do_plano(UUID, UUID) TO authenticated;

-- Add function comment
COMMENT ON FUNCTION public.get_funcionarios_fora_do_plano(UUID, UUID) IS 
'Returns active employees from a CNPJ who are not currently assigned to the specified plan. 
Employees can be in multiple plans, so this only excludes those already in the current plan.';
