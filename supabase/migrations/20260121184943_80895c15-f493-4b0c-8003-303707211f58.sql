-- Correção completa das funções de ativação e exclusão de funcionários
-- 1. Corrigir tipo de variável v_pendencia_id (era UUID, deve ser INTEGER)
-- 2. Padronizar status de exclusão para 'exclusao_solicitada'
-- 3. Adicionar search_path para segurança
-- 4. Adicionar validações preventivas

-- ===========================================
-- FUNÇÃO: ativar_funcionario_no_plano (CORRIGIDA)
-- ===========================================
CREATE OR REPLACE FUNCTION public.ativar_funcionario_no_plano(p_funcionario_id uuid, p_plano_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_rows_affected INTEGER;  -- CORRIGIDO: era UUID, agora INTEGER
    v_funcionario_exists BOOLEAN;
    v_plano_exists BOOLEAN;
BEGIN
    -- Validar que o funcionário existe
    SELECT EXISTS(SELECT 1 FROM funcionarios WHERE id = p_funcionario_id) INTO v_funcionario_exists;
    IF NOT v_funcionario_exists THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Funcionário não encontrado');
    END IF;

    -- Validar que o plano existe
    SELECT EXISTS(SELECT 1 FROM dados_planos WHERE id = p_plano_id) INTO v_plano_exists;
    IF NOT v_plano_exists THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Plano não encontrado');
    END IF;

    -- 1. Resolver pendência de ativação para o plano correspondente (se existir)
    UPDATE public.pendencias
    SET status = 'resolvida',
        updated_at = NOW()
    WHERE funcionario_id = p_funcionario_id
      AND tipo = 'ativacao'
      AND status = 'pendente'
      AND tipo_plano::text = (SELECT tipo_seguro::text FROM dados_planos WHERE id = p_plano_id);
    
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

    -- 2. Garantir vínculo no plano
    INSERT INTO public.planos_funcionarios (plano_id, funcionario_id, status)
    VALUES (p_plano_id, p_funcionario_id, 'ativo')
    ON CONFLICT (plano_id, funcionario_id) DO UPDATE
      SET status = 'ativo';

    -- 3. Atualizar status global do funcionário para ativo
    UPDATE public.funcionarios
    SET status = 'ativo',
        updated_at = NOW()
    WHERE id = p_funcionario_id
      AND status IN ('pendente', 'inativo', 'exclusao_solicitada');

    RETURN jsonb_build_object(
        'success', TRUE, 
        'message', 'Funcionário ativado com sucesso.',
        'pendencias_resolvidas', v_rows_affected
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', FALSE, 
            'error', SQLERRM
        );
END;
$function$;

-- ===========================================
-- FUNÇÃO: solicitar_exclusao_funcionario (PADRONIZADA)
-- ===========================================
CREATE OR REPLACE FUNCTION public.solicitar_exclusao_funcionario(
    p_funcionario_id UUID,
    p_motivo TEXT DEFAULT NULL,
    p_usuario_solicitante UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_funcionario RECORD;
    v_empresa_nome TEXT;
BEGIN
    -- Buscar funcionário
    SELECT f.*, c.razao_social, c.empresa_id
    INTO v_funcionario
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = p_funcionario_id;

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário não encontrado');
    END IF;

    -- Verificar se já está em processo de exclusão ou arquivado
    IF v_funcionario.status IN ('exclusao_solicitada', 'arquivado') THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário já está em processo de exclusão ou arquivado');
    END IF;

    -- Buscar nome da empresa
    SELECT nome INTO v_empresa_nome FROM empresas WHERE id = v_funcionario.empresa_id;

    -- Atualizar status do funcionário para exclusao_solicitada (PADRONIZADO)
    UPDATE funcionarios
    SET 
        status = 'exclusao_solicitada',
        motivo_exclusao = p_motivo,
        data_solicitacao_exclusao = NOW(),
        usuario_solicitante = p_usuario_solicitante,
        updated_at = NOW()
    WHERE id = p_funcionario_id;

    RETURN json_build_object(
        'success', true,
        'message', 'Solicitação de exclusão registrada com sucesso',
        'funcionario', json_build_object(
            'id', v_funcionario.id,
            'nome', v_funcionario.nome,
            'empresa', v_empresa_nome,
            'status', 'exclusao_solicitada'
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ===========================================
-- FUNÇÃO: executar_exclusao_funcionario (PADRONIZADA)
-- ===========================================
CREATE OR REPLACE FUNCTION public.executar_exclusao_funcionario(
    p_funcionario_id UUID,
    p_usuario_executor UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_funcionario RECORD;
    v_empresa_nome TEXT;
BEGIN
    -- Buscar funcionário com status correto (PADRONIZADO)
    SELECT f.*, c.razao_social, c.empresa_id
    INTO v_funcionario
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = p_funcionario_id
      AND f.status = 'exclusao_solicitada';  -- PADRONIZADO: era 'pendente_exclusao'

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário não encontrado ou não está com exclusão solicitada');
    END IF;

    -- Verificar se já está arquivado
    IF v_funcionario.status = 'arquivado' THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário já está arquivado');
    END IF;

    -- Buscar nome da empresa
    SELECT nome INTO v_empresa_nome FROM empresas WHERE id = v_funcionario.empresa_id;

    -- Arquivar funcionário
    UPDATE funcionarios
    SET 
        status = 'arquivado',
        data_exclusao = NOW(),
        usuario_executor = p_usuario_executor,
        updated_at = NOW()
    WHERE id = p_funcionario_id;

    -- Atualizar vínculos com planos para inativo
    UPDATE planos_funcionarios
    SET status = 'inativo'
    WHERE funcionario_id = p_funcionario_id;

    -- Resolver pendências relacionadas
    UPDATE pendencias
    SET status = 'resolvida', updated_at = NOW()
    WHERE funcionario_id = p_funcionario_id
      AND status = 'pendente';

    RETURN json_build_object(
        'success', true,
        'message', 'Funcionário arquivado com sucesso',
        'funcionario', json_build_object(
            'id', v_funcionario.id,
            'nome', v_funcionario.nome,
            'empresa', v_empresa_nome,
            'status', 'arquivado'
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ===========================================
-- FUNÇÃO: resolver_exclusao_funcionario (MELHORADA)
-- ===========================================
CREATE OR REPLACE FUNCTION public.resolver_exclusao_funcionario(
    p_funcionario_id UUID,
    p_aprovado BOOLEAN,
    p_usuario_executor UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_funcionario RECORD;
    v_empresa_nome TEXT;
    v_novo_status TEXT;
BEGIN
    -- Buscar funcionário (PADRONIZADO)
    SELECT f.*, c.razao_social, c.empresa_id
    INTO v_funcionario
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.id = p_funcionario_id
      AND f.status = 'exclusao_solicitada';  -- PADRONIZADO

    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário não encontrado ou não está com exclusão solicitada');
    END IF;

    -- Verificar se já está arquivado
    IF v_funcionario.status = 'arquivado' THEN
        RETURN json_build_object('success', false, 'error', 'Funcionário já está arquivado');
    END IF;

    -- Buscar nome da empresa
    SELECT nome INTO v_empresa_nome FROM empresas WHERE id = v_funcionario.empresa_id;

    IF p_aprovado THEN
        -- Aprovar exclusão - arquivar funcionário
        v_novo_status := 'arquivado';
        
        UPDATE funcionarios
        SET 
            status = 'arquivado',
            data_exclusao = NOW(),
            usuario_executor = p_usuario_executor,
            updated_at = NOW()
        WHERE id = p_funcionario_id;

        -- Atualizar vínculos com planos para inativo
        UPDATE planos_funcionarios
        SET status = 'inativo'
        WHERE funcionario_id = p_funcionario_id;

        -- Resolver pendências relacionadas
        UPDATE pendencias
        SET status = 'resolvida', updated_at = NOW()
        WHERE funcionario_id = p_funcionario_id
          AND status = 'pendente';

        RETURN json_build_object(
            'success', true,
            'message', 'Exclusão aprovada - funcionário arquivado com sucesso',
            'funcionario', json_build_object(
                'id', v_funcionario.id,
                'nome', v_funcionario.nome,
                'empresa', v_empresa_nome,
                'novo_status', v_novo_status
            )
        );
    ELSE
        -- Negar exclusão - reativar funcionário
        v_novo_status := 'ativo';
        
        UPDATE funcionarios
        SET 
            status = 'ativo',
            motivo_exclusao = NULL,
            data_solicitacao_exclusao = NULL,
            usuario_solicitante = NULL,
            updated_at = NOW()
        WHERE id = p_funcionario_id;

        RETURN json_build_object(
            'success', true,
            'message', 'Exclusão negada - funcionário reativado com sucesso',
            'funcionario', json_build_object(
                'id', v_funcionario.id,
                'nome', v_funcionario.nome,
                'empresa', v_empresa_nome,
                'novo_status', v_novo_status
            )
        );
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- ===========================================
-- FUNÇÃO: get_funcionarios_fora_do_plano (SEGURANÇA)
-- ===========================================
CREATE OR REPLACE FUNCTION public.get_funcionarios_fora_do_plano(p_plano_id UUID)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    cpf TEXT,
    cargo TEXT,
    salario NUMERIC,
    status TEXT,
    cnpj_id UUID,
    cnpj_numero TEXT,
    razao_social TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_cnpj_id UUID;
BEGIN
    -- Buscar o cnpj_id do plano
    SELECT dp.cnpj_id INTO v_cnpj_id
    FROM dados_planos dp
    WHERE dp.id = p_plano_id;

    IF v_cnpj_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar funcionários do mesmo CNPJ que NÃO estão no plano
    RETURN QUERY
    SELECT 
        f.id,
        f.nome,
        f.cpf,
        f.cargo,
        f.salario,
        f.status::TEXT,
        f.cnpj_id,
        c.cnpj AS cnpj_numero,
        c.razao_social
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE f.cnpj_id = v_cnpj_id
      AND f.status IN ('ativo', 'pendente')
      AND NOT EXISTS (
          SELECT 1 FROM planos_funcionarios pf
          WHERE pf.funcionario_id = f.id
            AND pf.plano_id = p_plano_id
            AND pf.status = 'ativo'
      )
    ORDER BY f.nome;
END;
$function$;