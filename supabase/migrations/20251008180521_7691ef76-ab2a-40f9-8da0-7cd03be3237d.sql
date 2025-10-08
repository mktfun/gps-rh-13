-- Create function to fetch a single funcionário with CNPJ info
CREATE OR REPLACE FUNCTION public.get_funcionario_by_id(p_funcionario_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  cpf text,
  cargo text,
  salario numeric,
  idade integer,
  status text,
  data_nascimento date,
  email text,
  estado_civil text,
  created_at timestamptz,
  updated_at timestamptz,
  data_admissao date,
  cnpj_id uuid,
  cnpj_razao_social text,
  cnpj_numero text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.nome,
    f.cpf,
    f.cargo,
    f.salario,
    f.idade,
    f.status::text,
    f.data_nascimento,
    f.email,
    f.estado_civil::text,
    f.created_at,
    f.updated_at,
    f.data_admissao,
    f.cnpj_id,
    c.razao_social::text AS cnpj_razao_social,
    c.cnpj::text AS cnpj_numero
  FROM public.funcionarios f
  JOIN public.cnpjs c ON f.cnpj_id = c.id
  WHERE f.id = p_funcionario_id;
END;
$$;