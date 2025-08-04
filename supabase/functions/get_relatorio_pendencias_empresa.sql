
CREATE OR REPLACE FUNCTION get_relatorio_pendencias_empresa(
  p_empresa_id UUID
)
RETURNS TABLE (
  funcionario_nome TEXT,
  cpf TEXT,
  cargo TEXT,
  status TEXT,
  cnpj_razao_social TEXT,
  data_solicitacao DATE,
  motivo TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    f.nome as funcionario_nome,
    f.cpf,
    f.cargo,
    f.status,
    c.razao_social as cnpj_razao_social,
    f.updated_at::DATE as data_solicitacao,
    CASE 
      WHEN f.status = 'pendente' THEN 'Inclusão pendente'
      WHEN f.status = 'exclusao_solicitada' THEN 'Exclusão solicitada'
      WHEN f.status = 'inativo' THEN 'Funcionário inativo'
      ELSE 'Verificar status'
    END as motivo
  FROM funcionarios f
  INNER JOIN cnpjs c ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND f.status IN ('pendente', 'exclusao_solicitada', 'inativo')
  ORDER BY f.updated_at DESC;
END;
$$;
