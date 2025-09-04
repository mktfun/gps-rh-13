-- CONTINUAÇÃO: Corrigindo mais funções com SET search_path = 'public';

-- 8. get_smart_actions_corretor
CREATE OR REPLACE FUNCTION public.get_smart_actions_corretor()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SET search_path = 'public';
    SELECT jsonb_build_object(
        'aprovacoes_rapidas', COUNT(CASE WHEN p.tipo = 'cancelamento' AND p.status = 'pendente' THEN 1 END),
        'ativacoes_pendentes', COUNT(CASE WHEN p.tipo = 'ativacao' AND p.status = 'pendente' THEN 1 END),
        'cnpjs_sem_plano', COUNT(DISTINCT CASE WHEN dp.id IS NULL AND c.status = 'ativo' THEN c.id END),
        'funcionarios_travados', COUNT(CASE WHEN p.tipo = 'ativacao' AND p.status = 'pendente' AND p.data_criacao < NOW() - INTERVAL '5 days' THEN 1 END)
    ) INTO v_result
    FROM cnpjs c
    JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN pendencias p ON p.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id;

    RETURN v_result;
END;
$function$;

-- 9. get_plano_detalhes
CREATE OR REPLACE FUNCTION public.get_plano_detalhes(p_plano_id uuid)
 RETURNS TABLE(id uuid, seguradora text, valor_mensal numeric, cobertura_morte numeric, cobertura_morte_acidental numeric, cobertura_invalidez_acidente numeric, cobertura_auxilio_funeral numeric, cnpj_id uuid, cnpj_numero text, cnpj_razao_social text, empresa_nome text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
    SELECT
      dp.id,
      dp.seguradora,
      dp.valor_mensal,
      dp.cobertura_morte,
      dp.cobertura_morte_acidental,
      dp.cobertura_invalidez_acidente,
      dp.cobertura_auxilio_funeral,
      c.id as cnpj_id,
      c.cnpj as cnpj_numero,
      c.razao_social as cnpj_razao_social,
      e.nome as empresa_nome
    FROM
      dados_planos dp
    JOIN
      cnpjs c ON dp.cnpj_id = c.id
    JOIN
      empresas e ON c.empresa_id = e.id
    WHERE
      dp.id = p_plano_id
      AND c.status = 'ativo';
END;
$function$;

-- 10. get_empresas_unificadas
CREATE OR REPLACE FUNCTION public.get_empresas_unificadas(p_corretora_id uuid)
 RETURNS TABLE(id uuid, nome text, planos_saude bigint, planos_vida bigint, funcionarios_ativos bigint, funcionarios_pendentes bigint, total_funcionarios bigint, pendencias_criticas bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    SET search_path = 'public';
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
        WHERE e.corretora_id = p_corretora_id
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
$function$;

-- 11. get_pulse_financeiro_corretor
CREATE OR REPLACE FUNCTION public.get_pulse_financeiro_corretor()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_receita_mes numeric := 0;
    v_receita_mes_anterior numeric := 0;
    v_comissao_estimada numeric := 0;
    v_comissao_vida numeric := 0;
    v_comissao_outros numeric := 0;
    v_margem_risco numeric := 0;
    v_oportunidades numeric := 0;
    v_crescimento_percentual numeric := 0;
BEGIN
    SET search_path = 'public';
    -- Receita do mês atual (apenas seguros de vida)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro = 'vida'
    AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE);

    -- Receita do mês anterior (apenas seguros de vida)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO v_receita_mes_anterior
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro = 'vida'
    AND DATE_TRUNC('month', dp.created_at) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');

    -- Comissão estimada para seguros de vida (20%)
    SELECT COALESCE(SUM(dp.valor_mensal * 0.20), 0) INTO v_comissao_vida
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro = 'vida';

    -- Comissão estimada para outros tipos de seguro (5%)
    SELECT COALESCE(SUM(dp.valor_mensal * 0.05), 0) INTO v_comissao_outros
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.tipo_seguro != 'vida';

    -- Comissão total
    v_comissao_estimada := v_comissao_vida + v_comissao_outros;

    -- Margem de risco (funcionários ativos vs total)
    SELECT CASE 
        WHEN COUNT(f.id) > 0 THEN 
            (COUNT(CASE WHEN f.status = 'ativo' THEN 1 END)::numeric / COUNT(f.id)::numeric) * 100
        ELSE 100
    END INTO v_margem_risco
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id;

    -- Oportunidades (CNPJs sem plano de seguro de vida)
    SELECT COUNT(c.id) * 500 INTO v_oportunidades
    FROM cnpjs c
    INNER JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON (dp.cnpj_id = c.id AND dp.tipo_seguro = 'vida')
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.id IS NULL;

    -- Calcular crescimento percentual
    IF v_receita_mes_anterior > 0 THEN
        v_crescimento_percentual := ((v_receita_mes - v_receita_mes_anterior) / v_receita_mes_anterior) * 100;
    ELSE
        v_crescimento_percentual := 0;
    END IF;

    RETURN jsonb_build_object(
        'receita_mes', v_receita_mes,
        'crescimento_percentual', v_crescimento_percentual,
        'comissao_estimada', v_comissao_estimada,
        'margem_risco', v_margem_risco,
        'oportunidades', v_oportunidades
    );
END;
$function$;

-- 12. solicitar_exclusao_funcionario
CREATE OR REPLACE FUNCTION public.solicitar_exclusao_funcionario(p_funcionario_id uuid, p_motivo text DEFAULT 'Solicitação da empresa'::text)
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

  -- Buscar funcionário
  SELECT f.*, e.nome as empresa_nome
  INTO v_funcionario
  FROM funcionarios f
  JOIN cnpjs c ON f.cnpj_id = c.id
  JOIN empresas e ON c.empresa_id = e.id
  WHERE f.id = p_funcionario_id 
    AND f.status = 'ativo';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Funcionário não encontrado ou não está ativo'
    );
  END IF;

  -- Atualizar status para pendente_exclusao (SEM ENVIO DE EMAIL)
  UPDATE funcionarios 
  SET 
    status = 'pendente_exclusao',
    data_solicitacao_exclusao = NOW(),
    motivo_exclusao = p_motivo,
    usuario_solicitante = v_user_id,
    updated_at = NOW()
  WHERE id = p_funcionario_id;

  -- Retornar sucesso (SEM LÓGICA DE EMAIL)
  RETURN json_build_object(
    'success', true,
    'message', 'Solicitação de exclusão registrada com sucesso',
    'funcionario', json_build_object(
      'id', v_funcionario.id,
      'nome', v_funcionario.nome,
      'empresa', v_funcionario.empresa_nome
    )
  );
END;
$function$;