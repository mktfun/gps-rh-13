-- QUARTA PARTE: Corrigindo mais funções críticas do dashboard

-- 19. iniciar_ou_obter_conversa_por_protocolo
CREATE OR REPLACE FUNCTION public.iniciar_ou_obter_conversa_por_protocolo(p_empresa_id uuid, p_protocolo text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_corretora_id UUID;
  v_conversa_id UUID;
  v_has_access BOOLEAN := FALSE;
BEGIN
  SET search_path = 'public';
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  -- Verifica se usuário é a empresa dona OU a corretora da empresa
  SELECT TRUE INTO v_has_access
  FROM profiles p
  WHERE p.id = v_user_id
    AND (
      (p.role = 'empresa' AND p.empresa_id = p_empresa_id)
      OR
      (p.role = 'corretora' AND EXISTS (
        SELECT 1 FROM empresas e
        WHERE e.id = p_empresa_id AND e.corretora_id = p.id
      ))
    )
  LIMIT 1;

  IF NOT COALESCE(v_has_access, FALSE) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Busca corretora dona da empresa
  SELECT e.corretora_id INTO v_corretora_id
  FROM empresas e
  WHERE e.id = p_empresa_id;

  IF v_corretora_id IS NULL THEN
    RAISE EXCEPTION 'Empresa inválida ou sem corretora associada';
  END IF;

  -- Tenta localizar conversa existente para o protocolo
  SELECT c.id INTO v_conversa_id
  FROM conversas c
  WHERE c.empresa_id = p_empresa_id
    AND c.protocolo = p_protocolo
  LIMIT 1;

  -- Se não existe, cria
  IF v_conversa_id IS NULL THEN
    INSERT INTO conversas (empresa_id, corretora_id, protocolo)
    VALUES (p_empresa_id, v_corretora_id, p_protocolo)
    RETURNING id INTO v_conversa_id;
  END IF;

  RETURN v_conversa_id;
END;
$function$;

-- 20. get_funcionarios_arquivados
CREATE OR REPLACE FUNCTION public.get_funcionarios_arquivados(p_cnpj_id uuid)
 RETURNS TABLE(id uuid, nome text, cpf text, data_nascimento date, idade integer, cargo text, salario numeric, estado_civil estado_civil, email text, cnpj_id uuid, status funcionario_status, created_at timestamp with time zone, updated_at timestamp with time zone, data_solicitacao_exclusao timestamp with time zone, data_exclusao timestamp with time zone, motivo_exclusao text, usuario_solicitante uuid, usuario_executor uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
  SELECT 
    f.id,
    f.nome,
    f.cpf,
    f.data_nascimento,
    f.idade,
    f.cargo,
    f.salario,
    f.estado_civil,
    f.email,
    f.cnpj_id,
    f.status,
    f.created_at,
    f.updated_at,
    f.data_solicitacao_exclusao,
    f.data_exclusao,
    f.motivo_exclusao,
    f.usuario_solicitante,
    f.usuario_executor
  FROM funcionarios f
  WHERE f.cnpj_id = p_cnpj_id 
    AND f.status = 'arquivado';
END;
$function$;

-- 21. set_pendencia_corretora_id (trigger function)
CREATE OR REPLACE FUNCTION public.set_pendencia_corretora_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  -- Buscar a corretora dona do CNPJ da pendência
  SELECT e.corretora_id
  INTO NEW.corretora_id
  FROM cnpjs c
  JOIN empresas e ON e.id = c.empresa_id
  WHERE c.id = NEW.cnpj_id;

  RETURN NEW;
END;
$function$;

-- 22. resolver_pendencias_ativacao_automatica (trigger function)
CREATE OR REPLACE FUNCTION public.resolver_pendencias_ativacao_automatica()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  -- Only process when status changes to 'ativo'
  IF NEW.status = 'ativo' AND (OLD.status IS NULL OR OLD.status != 'ativo') THEN
    
    -- Update all pending activation pendencias for this employee to resolved
    UPDATE pendencias
    SET 
      status = 'resolvida',
      updated_at = NOW()
    WHERE funcionario_id = NEW.id
      AND tipo = 'ativacao'
      AND status = 'pendente';
    
    -- Log the resolution
    RAISE NOTICE 'Auto-resolved activation pendencias for employee %', NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 23. get_funcionarios_ativos
CREATE OR REPLACE FUNCTION public.get_funcionarios_ativos(p_cnpj_id uuid)
 RETURNS TABLE(id uuid, nome text, cpf text, data_nascimento date, idade integer, cargo text, salario numeric, estado_civil estado_civil, email text, cnpj_id uuid, status funcionario_status, created_at timestamp with time zone, updated_at timestamp with time zone, data_solicitacao_exclusao timestamp with time zone, data_exclusao timestamp with time zone, motivo_exclusao text, usuario_solicitante uuid, usuario_executor uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
  SELECT 
    f.id,
    f.nome,
    f.cpf,
    f.data_nascimento,
    f.idade,
    f.cargo,
    f.salario,
    f.estado_civil,
    f.email,
    f.cnpj_id,
    f.status,
    f.created_at,
    f.updated_at,
    f.data_solicitacao_exclusao,
    f.data_exclusao,
    f.motivo_exclusao,
    f.usuario_solicitante,
    f.usuario_executor
  FROM funcionarios f
  WHERE f.cnpj_id = p_cnpj_id 
    AND f.status = 'ativo'
  ORDER BY f.nome;
END;
$function$;

-- Agora vamos corrigir as funções dos arquivos SQL do projeto

-- 24. get_relatorio_funcionarios_empresa (dos arquivos)
CREATE OR REPLACE FUNCTION get_relatorio_funcionarios_empresa(
  p_empresa_id UUID,
  p_cnpj_id UUID DEFAULT NULL
)
RETURNS TABLE (
  funcionario_id UUID,
  nome TEXT,
  cpf TEXT,
  cargo TEXT,
  salario NUMERIC,
  status TEXT,
  cnpj_razao_social TEXT,
  data_contratacao DATE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
  SELECT 
    f.id as funcionario_id,
    f.nome,
    f.cpf,
    f.cargo,
    f.salario,
    f.status,
    c.razao_social as cnpj_razao_social,
    f.data_contratacao
  FROM funcionarios f
  INNER JOIN cnpjs c ON f.cnpj_id = c.id
  WHERE c.empresa_id = p_empresa_id
    AND (p_cnpj_id IS NULL OR f.cnpj_id = p_cnpj_id)
  ORDER BY c.razao_social, f.nome;
END;
$$;

-- 25. get_relatorio_pendencias_empresa
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
SET search_path TO 'public'
AS $$
BEGIN
  SET search_path = 'public';
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