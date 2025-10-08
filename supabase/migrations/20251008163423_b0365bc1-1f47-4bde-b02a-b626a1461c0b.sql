-- Corrigir bug de ambiguidade na função get_empresas_com_metricas
-- Substituir COUNT(f.id) por COUNT(*) para evitar erro 42702

DROP FUNCTION IF EXISTS public.get_empresas_com_metricas();

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
SET search_path TO 'public'
AS $$
DECLARE
  v_corretora_id UUID;
  v_role TEXT;
BEGIN
  SET search_path = 'public';
  
  -- Get current user ID and validate
  v_corretora_id := auth.uid();
  
  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;
  
  -- Validate user role
  SELECT role INTO v_role FROM profiles WHERE id = v_corretora_id;
  
  IF v_role != 'corretora' THEN
    RAISE EXCEPTION 'Acesso negado: Apenas corretoras podem acessar estes dados';
  END IF;

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
    -- Contagem total de funcionários ativos (CORRIGIDO: COUNT(*) ao invés de COUNT(f.id))
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    -- Contagem de pendências (CORRIGIDO: COUNT(*) ao invés de COUNT(f.id))
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    -- Status geral da empresa baseado nos CNPJs
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral
  FROM empresas e
  LEFT JOIN (
    -- Subconsulta para contar funcionários ativos
    SELECT 
        c.empresa_id,
        COUNT(*) as total_funcionarios
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    -- Subconsulta para contar pendências
    SELECT 
        c.empresa_id,
        COUNT(*) as total_pendencias
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('pendente', 'exclusao_solicitada')
    GROUP BY c.empresa_id
  ) pendencias_count ON pendencias_count.empresa_id = e.id
  LEFT JOIN (
    -- Subconsulta para verificar status dos CNPJs
    SELECT 
        empresa_id,
        COUNT(CASE WHEN status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM cnpjs
    GROUP BY empresa_id
  ) cnpj_status ON cnpj_status.empresa_id = e.id
  WHERE e.corretora_id = v_corretora_id;
END;
$$;