-- QUINTA PARTE FINAL: Corrigindo as funções restantes mais importantes

-- 26. get_relatorio_custos_empresa
CREATE OR REPLACE FUNCTION get_relatorio_custos_empresa(
  p_empresa_id UUID
)
RETURNS TABLE (
  cnpj_razao_social TEXT,
  funcionario_nome TEXT,
  funcionario_cpf TEXT,
  valor_individual NUMERIC,
  status TEXT,
  total_cnpj NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  SET search_path = 'public';
  RETURN QUERY
  WITH custos_por_cnpj AS (
    SELECT 
      c.razao_social,
      dp.valor_mensal as total_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
  )
  SELECT 
    c.razao_social as cnpj_razao_social,
    f.nome as funcionario_nome,
    f.cpf as funcionario_cpf,
    COALESCE(dp.valor_mensal, 0) as valor_individual,
    f.status::TEXT,
    COALESCE(dp.valor_mensal, 0) as total_cnpj
  FROM cnpjs c
  INNER JOIN funcionarios f ON f.cnpj_id = c.id
  LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
  INNER JOIN custos_por_cnpj cpc ON cpc.razao_social = c.razao_social
  WHERE c.empresa_id = p_empresa_id
  ORDER BY c.razao_social, f.nome;
END;
$$;

-- 27. get_relatorio_financeiro_corretora
CREATE OR REPLACE FUNCTION get_relatorio_financeiro_corretora(p_corretora_id uuid)
RETURNS TABLE (
    empresa_id uuid,
    empresa_nome text,
    total_cnpjs_ativos bigint,
    total_funcionarios_segurados bigint,
    custo_total_mensal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    SET search_path = 'public';
    RETURN QUERY
    SELECT 
        e.id as empresa_id,
        e.nome as empresa_nome,
        COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) as total_cnpjs_ativos,
        COUNT(DISTINCT CASE WHEN f.status IN ('ativo', 'pendente') THEN f.id END) as total_funcionarios_segurados,
        COALESCE(SUM(CASE WHEN c.status = 'ativo' THEN dp.valor_mensal ELSE 0 END), 0) as custo_total_mensal
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = p_corretora_id
    GROUP BY e.id, e.nome
    HAVING COUNT(DISTINCT CASE WHEN c.status = 'ativo' THEN c.id END) > 0
    ORDER BY custo_total_mensal DESC;
END;
$$;

-- 28. get_relatorio_geral_funcionarios
CREATE OR REPLACE FUNCTION get_relatorio_geral_funcionarios(
    p_corretora_id uuid,
    p_empresa_id uuid DEFAULT NULL,
    p_status text DEFAULT NULL
)
RETURNS TABLE (
    funcionario_id uuid,
    funcionario_nome text,
    funcionario_cpf text,
    funcionario_cargo text,
    funcionario_salario numeric,
    funcionario_status text,
    funcionario_data_contratacao timestamp with time zone,
    empresa_nome text,
    cnpj_razao_social text,
    cnpj_numero text
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
        f.nome as funcionario_nome,
        f.cpf as funcionario_cpf,
        f.cargo as funcionario_cargo,
        f.salario as funcionario_salario,
        f.status as funcionario_status,
        f.created_at as funcionario_data_contratacao,
        e.nome as empresa_nome,
        c.razao_social as cnpj_razao_social,
        c.cnpj as cnpj_numero
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = p_corretora_id
    AND (p_empresa_id IS NULL OR e.id = p_empresa_id)
    AND (p_status IS NULL OR f.status = p_status)
    ORDER BY e.nome, c.razao_social, f.nome;
END;
$$;

-- 29. get_top_empresas_receita
CREATE OR REPLACE FUNCTION get_top_empresas_receita()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result json;
BEGIN
    SET search_path = 'public';
    -- Buscar top empresas por receita (valor fixo do plano, não multiplicado por funcionários)
    SELECT json_agg(
        json_build_object(
            'id', e.id,
            'nome', e.nome,
            'receita_mensal', COALESCE(dp.valor_mensal, 0), -- Valor fixo do plano
            'funcionarios_ativos', COALESCE(func_count.total, 0),
            'pendencias', COALESCE(pend_count.total, 0)
        )
        ORDER BY COALESCE(dp.valor_mensal, 0) DESC
    ) INTO result
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id AND c.status = 'ativo'
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN (
        SELECT 
            c2.empresa_id,
            COUNT(f.id) as total
        FROM cnpjs c2
        LEFT JOIN funcionarios f ON f.cnpj_id = c2.id AND f.status IN ('ativo', 'pendente')
        WHERE c2.status = 'ativo'
        GROUP BY c2.empresa_id
    ) func_count ON func_count.empresa_id = e.id
    LEFT JOIN (
        SELECT 
            c3.empresa_id,
            COUNT(f2.id) as total
        FROM cnpjs c3
        LEFT JOIN funcionarios f2 ON f2.cnpj_id = c3.id AND f2.status = 'pendente_exclusao'
        WHERE c3.status = 'ativo'
        GROUP BY c3.empresa_id
    ) pend_count ON pend_count.empresa_id = e.id
    WHERE dp.valor_mensal IS NOT NULL AND dp.valor_mensal > 0
    LIMIT 10;

    RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 30. get_empresas_com_metricas
CREATE OR REPLACE FUNCTION get_empresas_com_metricas()
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
BEGIN
  SET search_path = 'public';
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
  WHERE e.corretora_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 31. get_relatorio_movimentacao_corretora
CREATE OR REPLACE FUNCTION get_relatorio_movimentacao_corretora(
    p_corretora_id uuid,
    p_data_inicio date,
    p_data_fim date
)
RETURNS TABLE (
    mes text,
    inclusoes bigint,  
    exclusoes bigint,
    saldo bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    SET search_path = 'public';
    -- Validação do período (máximo 2 anos) - CORRIGIDA
    IF p_data_fim > p_data_inicio + INTERVAL '2 years' THEN
        RAISE EXCEPTION 'Período não pode ser superior a 2 anos';
    END IF;

    RETURN QUERY
    WITH meses_periodo AS (
        SELECT 
            TO_CHAR(generate_series(
                DATE_TRUNC('month', p_data_inicio),
                DATE_TRUNC('month', p_data_fim),
                INTERVAL '1 month'
            ), 'YYYY-MM') as mes_ref
    ),
    inclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_inclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND DATE(f.created_at) BETWEEN p_data_inicio AND p_data_fim
            AND f.status = 'ativo'
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.created_at), 'YYYY-MM')
    ),
    exclusoes_mes AS (
        SELECT 
            TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM') as mes_ref,
            COUNT(*) as total_exclusoes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        INNER JOIN empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = p_corretora_id
            AND f.data_exclusao IS NOT NULL
            AND DATE(f.data_exclusao) BETWEEN p_data_inicio AND p_data_fim
        GROUP BY TO_CHAR(DATE_TRUNC('month', f.data_exclusao), 'YYYY-MM')
    )
    SELECT 
        mp.mes_ref as mes,
        COALESCE(im.total_inclusoes, 0) as inclusoes,
        COALESCE(em.total_exclusoes, 0) as exclusoes,
        COALESCE(im.total_inclusoes, 0) - COALESCE(em.total_exclusoes, 0) as saldo
    FROM meses_periodo mp
    LEFT JOIN inclusoes_mes im ON mp.mes_ref = im.mes_ref
    LEFT JOIN exclusoes_mes em ON mp.mes_ref = em.mes_ref
    ORDER BY mp.mes_ref;
END;
$$;

-- 32. get_empresa_dashboard_metrics (função principal crítica)
CREATE OR REPLACE FUNCTION get_empresa_dashboard_metrics(p_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    result json;
    custo_mensal_total numeric := 0;
    total_cnpjs integer := 0;
    total_funcionarios integer := 0;
    funcionarios_ativos integer := 0;
    funcionarios_pendentes integer := 0;
    custos_por_cnpj json;
    evolucao_mensal json;
    distribuicao_cargos json;
    plano_principal json;
BEGIN
    SET search_path = 'public';
    -- Calcular KPIs principais
    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs
    WHERE empresa_id = p_empresa_id
    AND status = 'ativo';

    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status IN ('ativo', 'pendente');

    SELECT COUNT(*) INTO funcionarios_ativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'ativo';

    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND f.status = 'pendente';

    -- Calcular custo mensal total
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND c.status = 'ativo';

    -- Buscar custos por CNPJ usando alias correto
    SELECT json_agg(
        json_build_object(
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'valor_mensal', COALESCE(c.valor_mensal, 0),
            'funcionarios_count', COALESCE(c.funcionarios_count, 0)
        )
    ) INTO custos_por_cnpj
    FROM (
        SELECT 
            c.id,
            c.cnpj,
            c.razao_social,
            dp.valor_mensal,
            COUNT(f.id) as funcionarios_count
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        WHERE c.empresa_id = p_empresa_id
        AND c.status = 'ativo'
        GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
    ) c;

    -- Distribuição por cargos
    SELECT json_agg(
        json_build_object(
            'cargo', cargo,
            'count', count
        )
    ) INTO distribuicao_cargos
    FROM (
        SELECT 
            f.cargo,
            COUNT(*) as count
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.status IN ('ativo', 'pendente')
        GROUP BY f.cargo
        ORDER BY count DESC
        LIMIT 5
    ) cargo_counts;

    -- Construir resultado final
    result := json_build_object(
        'total_cnpjs', total_cnpjs,
        'total_funcionarios', total_funcionarios,
        'funcionarios_ativos', funcionarios_ativos,
        'funcionarios_pendentes', funcionarios_pendentes,
        'custo_mensal_total', custo_mensal_total,
        'custos_por_cnpj', COALESCE(custos_por_cnpj, '[]'::json),
        'distribuicao_cargos', COALESCE(distribuicao_cargos, '[]'::json)
    );

    RETURN result;
END;
$$;