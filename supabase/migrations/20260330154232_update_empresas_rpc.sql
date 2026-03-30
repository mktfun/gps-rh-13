-- Atualizar a RPC get_empresas_com_metricas para suportar filtragem e paginação server-side

DROP FUNCTION IF EXISTS public.get_empresas_com_metricas();

CREATE OR REPLACE FUNCTION public.get_empresas_com_metricas(
  p_search TEXT DEFAULT NULL,
  p_page INT DEFAULT 1,
  p_page_size INT DEFAULT 10,
  p_order_by TEXT DEFAULT 'created_at',
  p_order_dir TEXT DEFAULT 'desc'
)
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
  status_geral TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_corretora_id UUID;
  v_role TEXT;
  v_offset INT;
BEGIN
  SET search_path = 'public';
  
  -- Get current user ID and validate
  v_corretora_id := auth.uid();
  
  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Validate user role
  SELECT role INTO v_role FROM profiles WHERE profiles.id = v_corretora_id;
  
  IF v_role != 'corretora' THEN
    RAISE EXCEPTION 'Acesso negado: Apenas corretoras podem acessar estes dados';
  END IF;

  v_offset := (p_page - 1) * p_page_size;

  RETURN QUERY
  WITH filtered_empresas AS (
    SELECT e.*
    FROM empresas e
    WHERE e.corretora_id = v_corretora_id
      AND (p_search IS NULL OR p_search = '' OR 
           e.nome ILIKE '%' || p_search || '%' OR
           e.responsavel ILIKE '%' || p_search || '%' OR
           e.email ILIKE '%' || p_search || '%')
  ),
  total_rows AS (
    SELECT COUNT(*) as cx FROM filtered_empresas
  )
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
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral,
    (SELECT cx FROM total_rows) as total_count
  FROM filtered_empresas e
  LEFT JOIN (
    SELECT c.empresa_id, COUNT(*) as total_funcionarios
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    SELECT c.empresa_id, COUNT(*) as total_pendencias
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('pendente', 'exclusao_solicitada')
    GROUP BY c.empresa_id
  ) pendencias_count ON pendencias_count.empresa_id = e.id
  LEFT JOIN (
    SELECT empresa_id, COUNT(CASE WHEN status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM cnpjs
    GROUP BY empresa_id
  ) cnpj_status ON cnpj_status.empresa_id = e.id
  ORDER BY 
    CASE WHEN p_order_dir = 'asc' THEN
      CASE p_order_by
        WHEN 'nome' THEN e.nome
        WHEN 'responsavel' THEN e.responsavel
        WHEN 'email' THEN e.email
        WHEN 'created_at' THEN e.created_at::text
        ELSE e.created_at::text
      END
    END ASC,
    CASE WHEN p_order_dir = 'desc' OR p_order_dir IS NULL THEN
      CASE p_order_by
        WHEN 'nome' THEN e.nome
        WHEN 'responsavel' THEN e.responsavel
        WHEN 'email' THEN e.email
        WHEN 'created_at' THEN e.created_at::text
        ELSE e.created_at::text
      END
    END DESC
  LIMIT p_page_size
  OFFSET v_offset;
END;
$$;
