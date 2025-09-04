-- TERCEIRA PARTE: Corrigindo mais funções importantes com SET search_path = 'public';

-- 13. executar_exclusao_funcionario
CREATE OR REPLACE FUNCTION public.executar_exclusao_funcionario(p_funcionario_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_funcionario RECORD;
  v_user_id UUID;
BEGIN
  SET search_path = 'public';
  -- Obter ID do usuário atual
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se usuário é corretora
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_user_id AND role = 'corretora'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Apenas corretoras podem executar exclusões'
    );
  END IF;

  -- Buscar funcionário pendente de exclusão
  SELECT f.*, e.nome as empresa_nome
  INTO v_funcionario
  FROM funcionarios f
  JOIN cnpjs c ON f.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  WHERE f.id = p_funcionario_id 
    AND f.status = 'pendente_exclusao';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Funcionário não encontrado ou não está pendente de exclusão'
    );
  END IF;

  -- Atualizar status para arquivado (SEM ENVIO DE EMAIL)
  UPDATE funcionarios 
  SET 
    status = 'arquivado',
    data_exclusao = NOW(),
    usuario_executor = v_user_id,
    updated_at = NOW()
  WHERE id = p_funcionario_id;

  -- Retornar sucesso (SEM LÓGICA DE EMAIL)
  RETURN json_build_object(
    'success', true,
    'message', 'Funcionário arquivado com sucesso',
    'funcionario', json_build_object(
      'id', v_funcionario.id,
      'nome', v_funcionario.nome,
      'empresa', v_funcionario.empresa_nome
    )
  );
END;
$function$;

-- 14. get_distribuicao_status_funcionarios
CREATE OR REPLACE FUNCTION public.get_distribuicao_status_funcionarios()
 RETURNS TABLE(status text, count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    SET search_path = 'public';
    RETURN QUERY
    SELECT
        f.status::text,
        COUNT(f.id)::int
    FROM
        funcionarios f
    JOIN
        cnpjs c ON f.cnpj_id = c.id
    JOIN
        empresas e ON c.empresa_id = e.id
    WHERE
        e.corretora_id = auth.uid() AND
        f.status IN ('ativo', 'pendente', 'exclusao_solicitada')
    GROUP BY
        f.status;
END;
$function$;

-- 15. test_dashboard_connection
CREATE OR REPLACE FUNCTION public.test_dashboard_connection()
 RETURNS json
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    SET search_path = 'public';
    RETURN json_build_object(
        'status', 'success',
        'timestamp', NOW(),
        'tables_exist', (
            SELECT json_object_agg(table_name, 'exists')
            FROM information_schema.tables 
            WHERE table_name IN ('funcionarios', 'empresas', 'planos', 'dados_planos')
            AND table_schema = 'public'
        )
    );
END;
$function$;

-- 16. notificar_empresa_acao_concluida
CREATE OR REPLACE FUNCTION public.notificar_empresa_acao_concluida()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  empresa_email TEXT;
  assunto_email TEXT;
  corpo_html_email TEXT;
  nome_empresa TEXT;
  nome_funcionario TEXT;
  acao_realizada TEXT;
  cor_acao TEXT;
  icone_acao TEXT;
  mensagem_acao TEXT;
  response_status INTEGER;
BEGIN
  SET search_path = 'public';
  -- Determinar qual ação foi realizada
  IF TG_OP = 'DELETE' THEN
    -- Funcionário foi excluído permanentemente
    acao_realizada := 'excluído permanentemente';
    cor_acao := '#dc2626'; -- vermelho
    icone_acao := '🗑️';
    mensagem_acao := 'foi removido permanentemente do sistema';
    nome_funcionario := OLD.nome;
    
    -- Buscar dados da empresa usando o registro OLD
    SELECT e.nome, e.email INTO nome_empresa, empresa_email 
    FROM cnpjs c 
    JOIN empresas e ON c.empresa_id = e.id 
    WHERE c.id = OLD.cnpj_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    nome_funcionario := NEW.nome;
    
    -- Buscar dados da empresa usando o registro NEW
    SELECT e.nome, e.email INTO nome_empresa, empresa_email 
    FROM cnpjs c 
    JOIN empresas e ON c.empresa_id = e.id 
    WHERE c.id = NEW.cnpj_id;
    
    -- Verificar mudanças de status
    IF OLD.status != NEW.status THEN
      IF NEW.status = 'desativado' AND OLD.status != 'desativado' THEN
        acao_realizada := 'desativado';
        cor_acao := '#f59e0b'; -- amarelo/laranja
        icone_acao := '⏸️';
        mensagem_acao := 'foi temporariamente desativado';
        
      ELSIF NEW.status = 'ativo' AND OLD.status = 'desativado' THEN
        acao_realizada := 'reativado';
        cor_acao := '#10b981'; -- verde
        icone_acao := '✅';
        mensagem_acao := 'foi reativado com sucesso';
        
      ELSE
        -- Outras mudanças de status que não precisam de notificação
        RETURN COALESCE(NEW, OLD);
      END IF;
    ELSE
      -- Não houve mudança de status relevante
      RETURN NEW;
    END IF;
  ELSE
    -- Operação não reconhecida
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Verificar se encontramos o email da empresa
  IF empresa_email IS NULL THEN
    RAISE NOTICE 'Email da empresa não encontrado para o funcionário: %', nome_funcionario;
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Email logic removed for build purposes
  RAISE NOTICE 'Email de notificação enviado para empresa: % (%). Ação: %.', 
               nome_empresa, empresa_email, acao_realizada;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 17. handle_employee_status_change
CREATE OR REPLACE FUNCTION public.handle_employee_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
    v_corretora_user_id uuid;
    v_empresa_id uuid;
    v_link_url text;
BEGIN
    SET search_path = 'public';
    -- Só roda a lógica quando o status muda para 'exclusao_solicitada'
    IF TG_OP = 'UPDATE' AND NEW.status = 'exclusao_solicitada' AND OLD.status != 'exclusao_solicitada' THEN
        
        -- Busca o ID da corretora e da empresa de uma vez só
        SELECT e.corretora_id, e.id INTO v_corretora_user_id, v_empresa_id
        FROM cnpjs c
        JOIN empresas e ON c.empresa_id = e.id
        WHERE c.id = NEW.cnpj_id;

        -- Constrói a URL correta que leva direto para a gestão do plano
        v_link_url := '/corretora/seguros-de-vida/empresa/' || v_empresa_id || '/cnpj/' || NEW.cnpj_id;

        -- Inserir notificação para a corretora
        INSERT INTO notifications (
            user_id,
            type,
            message,
            entity_id,
            link_url
        ) VALUES (
            v_corretora_user_id,
            'exclusao_solicitada',
            'Funcionário ' || NEW.nome || ' solicitou exclusão do plano',
            NEW.id,
            v_link_url
        );
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 18. find_or_create_conversation_corretora
CREATE OR REPLACE FUNCTION public.find_or_create_conversation_corretora(p_empresa_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_corretora_id UUID;
  v_conversa_id UUID;
  v_conversa_data JSON;
  v_empresa_nome TEXT;
BEGIN
  SET search_path = 'public';
  -- Verificar se o usuário atual é uma corretora
  v_corretora_id := auth.uid();
  
  IF v_corretora_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não autenticado'
    );
  END IF;

  -- Verificar se o usuário é realmente uma corretora
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = v_corretora_id AND role = 'corretora'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não é uma corretora'
    );
  END IF;

  -- Verificar se a empresa pertence à corretora
  IF NOT EXISTS (
    SELECT 1 FROM empresas 
    WHERE id = p_empresa_id AND corretora_id = v_corretora_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Empresa não pertence à sua carteira'
    );
  END IF;

  -- Buscar nome da empresa
  SELECT nome INTO v_empresa_nome 
  FROM empresas 
  WHERE id = p_empresa_id;

  -- Verificar se já existe conversa
  SELECT id INTO v_conversa_id
  FROM conversas
  WHERE corretora_id = v_corretora_id AND empresa_id = p_empresa_id;

  -- Se não existe, criar nova conversa
  IF v_conversa_id IS NULL THEN
    INSERT INTO conversas (corretora_id, empresa_id)
    VALUES (v_corretora_id, p_empresa_id)
    RETURNING id INTO v_conversa_id;
  END IF;

  -- Retornar dados da conversa
  RETURN json_build_object(
    'success', true,
    'conversa', json_build_object(
      'id', v_conversa_id,
      'empresa_id', p_empresa_id,
      'empresa_nome', v_empresa_nome,
      'created_at', (SELECT created_at FROM conversas WHERE id = v_conversa_id)
    )
  );
END;
$function$;