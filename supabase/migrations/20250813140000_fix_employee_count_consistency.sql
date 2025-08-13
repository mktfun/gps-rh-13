-- Fix employee count inconsistency between company list and company details
-- Update get_empresas_com_metricas to count all employees (not just active ones)
-- to match the behavior in company details page

CREATE OR REPLACE FUNCTION public.get_empresas_com_metricas()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  responsavel TEXT,
  email TEXT,
  telefone TEXT,
  corretora_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  primeiro_acesso BOOLEAN,
  total_funcionarios BIGINT,
  total_pendencias BIGINT,
  status_geral TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    e.responsavel,
    e.email,
    e.telefone,
    e.corretora_id,
    e.created_at,
    e.updated_at,
    e.primeiro_acesso,
    -- Count ALL employees (not just active ones) to match company details page
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    -- Real pendencies count (status = 'pendente')
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    -- Status based on CNPJs
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral
  FROM empresas e
  LEFT JOIN (
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_funcionarios
    FROM cnpjs c
    -- Removed status filter to count ALL employees, not just active ones
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    -- Count pendencies from the SOURCE OF TRUTH
    SELECT 
        c.empresa_id,
        COUNT(p.id) as total_pendencias
    FROM cnpjs c
    JOIN pendencias p ON p.cnpj_id = c.id
    WHERE p.status = 'pendente'
    GROUP BY c.empresa_id
  ) pendencias_count ON pendencias_count.empresa_id = e.id
  LEFT JOIN (
    SELECT 
        empresa_id,
        COUNT(CASE WHEN status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM cnpjs
    GROUP BY empresa_id
  ) cnpj_status ON cnpj_status.empresa_id = e.id
  WHERE e.corretora_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;
