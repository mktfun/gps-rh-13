-- CRITICAL SECURITY FIX: RLS Data Leakage
-- Remove insecure function overloads and create secure auth-scoped versions

-- 1. Drop existing insecure functions
DROP FUNCTION IF EXISTS public.get_empresas_com_metricas(uuid);
DROP FUNCTION IF EXISTS public.get_empresas_com_metricas();
DROP FUNCTION IF EXISTS public.get_empresas_unificadas(uuid);

-- 2. Create secure get_empresas_com_metricas() using auth.uid()
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
    -- Contagem total de funcionários ativos
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    -- Contagem de pendências (funcionários pendentes + exclusão solicitada)
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
        COUNT(f.id) as total_funcionarios
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    -- Subconsulta para contar pendências
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_pendencias
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

-- 3. Create secure get_empresas_unificadas() using auth.uid()
CREATE OR REPLACE FUNCTION public.get_empresas_unificadas()
RETURNS TABLE(
    id uuid, 
    nome text, 
    planos_saude bigint, 
    planos_vida bigint, 
    funcionarios_ativos bigint, 
    funcionarios_pendentes bigint, 
    total_funcionarios bigint, 
    pendencias_criticas bigint
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
    WITH empresa_stats AS (
        SELECT 
            e.id,
            e.nome,
            COALESCE(SUM(CASE WHEN dp.tipo_seguro = 'saude' THEN 1 ELSE 0 END), 0) as planos_saude,
            COALESCE(SUM(CASE WHEN dp.tipo_seguro = 'vida' THEN 1 ELSE 0 END), 0) as planos_vida,
            COALESCE(COUNT(CASE WHEN f.status = 'ativo' THEN 1 END), 0) as funcionarios_ativos,
            COALESCE(COUNT(CASE WHEN f.status = 'pendente' THEN 1 END), 0) as funcionarios_pendentes,
            COALESCE(COUNT(f.id), 0) as total_funcionarios,
            COALESCE(COUNT(CASE WHEN p.status = 'pendente' AND p.data_criacao < NOW() - INTERVAL '7 days' THEN 1 END), 0) as pendencias_criticas
        FROM empresas e
        LEFT JOIN cnpjs c ON c.empresa_id = e.id
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id
        LEFT JOIN pendencias p ON p.cnpj_id = c.id
        WHERE e.corretora_id = v_corretora_id
          AND c.status = 'ativo'
        GROUP BY e.id, e.nome
    )
    SELECT 
        es.id,
        es.nome,
        es.planos_saude,
        es.planos_vida,
        es.funcionarios_ativos,
        es.funcionarios_pendentes,
        es.total_funcionarios,
        es.pendencias_criticas
    FROM empresa_stats es
    WHERE (es.planos_saude + es.planos_vida) > 0
       OR es.funcionarios_ativos > 0
       OR es.funcionarios_pendentes > 0
    ORDER BY es.nome;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_empresas_com_metricas() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_empresas_unificadas() TO authenticated;