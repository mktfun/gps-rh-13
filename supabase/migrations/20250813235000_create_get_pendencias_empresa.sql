-- Create function to get pendencias from pendencias table for empresa context
CREATE OR REPLACE FUNCTION public.get_pendencias_empresa(p_empresa_id UUID)
RETURNS TABLE (
  id UUID,
  protocolo TEXT,
  tipo TEXT,
  funcionario_nome TEXT,
  funcionario_cpf TEXT,
  cnpj TEXT,
  razao_social TEXT,
  descricao TEXT,
  data_criacao TIMESTAMPTZ,
  data_vencimento DATE,
  status TEXT,
  dias_em_aberto INTEGER,
  comentarios_count INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.protocolo,
    p.tipo,
    f.nome as funcionario_nome,
    f.cpf as funcionario_cpf,
    c.cnpj,
    c.razao_social,
    p.descricao,
    p.data_criacao,
    p.data_vencimento,
    p.status,
    EXTRACT(DAY FROM NOW() - p.data_criacao)::INTEGER as dias_em_aberto,
    p.comentarios_count
  FROM pendencias p
  INNER JOIN funcionarios f ON p.funcionario_id = f.id
  INNER JOIN cnpjs c ON p.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND p.status = 'pendente'
  ORDER BY p.data_criacao DESC;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_pendencias_empresa(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_pendencias_empresa(UUID) IS 
'Returns all pending pendencias for a specific empresa from the pendencias table';
