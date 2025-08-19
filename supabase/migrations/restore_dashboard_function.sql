-- Função SQL simplificada para restaurar o dashboard
-- Esta versão restaura os dados básicos primeiro, depois corrigimos os cálculos

CREATE OR REPLACE FUNCTION get_empresa_dashboard_metrics(p_empresa_id UUID)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    custo_mensal_total DECIMAL(10,2) := 0;
    total_cnpjs INTEGER := 0;
    total_funcionarios INTEGER := 0;
    funcionarios_ativos INTEGER := 0;
    funcionarios_pendentes INTEGER := 0;
    custos_por_cnpj JSON;
    evolucao_mensal JSON;
    distribuicao_cargos JSON;
    plano_principal JSON;
BEGIN
    
    -- Total de CNPJs ativos da empresa
    SELECT COUNT(*) INTO total_cnpjs
    FROM cnpjs c
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';
    
    -- Total de funcionários
    SELECT COUNT(*) INTO total_funcionarios
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id;
    
    -- Funcionários ativos
    SELECT COUNT(*) INTO funcionarios_ativos
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'ativo';
    
    -- Funcionários pendentes
    SELECT COUNT(*) INTO funcionarios_pendentes
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.status = 'pendente';
    
    -- Custo mensal total (versão simples para restaurar dados)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';
    
    -- Custos por CNPJ (versão simples)
    SELECT json_agg(
        json_build_object(
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'valor_mensal', COALESCE(dp.valor_mensal, 0),
            'funcionarios_count', COALESCE(func_count.total, 0)
        )
    ) INTO custos_por_cnpj
    FROM cnpjs c
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN (
        SELECT 
            cnpj_id, 
            COUNT(*) as total
        FROM funcionarios 
        WHERE status IN ('ativo', 'pendente')
        GROUP BY cnpj_id
    ) func_count ON func_count.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';
    
    -- Evolução mensal (últimos 6 meses)
    SELECT json_agg(
        json_build_object(
            'mes', to_char(date_trunc('month', f.created_at), 'YYYY-MM'),
            'funcionarios', COUNT(*),
            'custo', COALESCE(SUM(COALESCE(dp.valor_mensal, 0)), 0)
        ) ORDER BY date_trunc('month', f.created_at)
    ) INTO evolucao_mensal
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND f.created_at >= date_trunc('month', current_date - interval '6 months')
    GROUP BY date_trunc('month', f.created_at);
    
    -- Distribuição por cargos
    SELECT json_agg(
        json_build_object(
            'cargo', COALESCE(cargo, 'Não informado'),
            'count', count
        )
    ) INTO distribuicao_cargos
    FROM (
        SELECT 
            cargo,
            COUNT(*) as count
        FROM funcionarios f
        JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
          AND f.status = 'ativo'
        GROUP BY cargo
        ORDER BY count DESC
        LIMIT 10
    ) cargos_top;
    
    -- Plano principal (maior valor mensal)
    SELECT json_build_object(
        'seguradora', dp.seguradora,
        'valor_mensal', COALESCE(dp.valor_mensal, 0),
        'cobertura_morte', COALESCE(dp.cobertura_morte, 0),
        'cobertura_morte_acidental', COALESCE(dp.cobertura_morte_acidental, 0),
        'cobertura_invalidez_acidente', COALESCE(dp.cobertura_invalidez_acidente, 0),
        'razao_social', c.razao_social,
        'tipo_seguro', dp.tipo_seguro
    ) INTO plano_principal
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY dp.valor_mensal DESC
    LIMIT 1;
    
    -- Montar resultado final
    SELECT json_build_object(
        'custoMensalTotal', custo_mensal_total,
        'totalCnpjs', total_cnpjs,
        'totalFuncionarios', total_funcionarios,
        'funcionariosAtivos', funcionarios_ativos,
        'funcionariosPendentes', funcionarios_pendentes,
        'custosPorCnpj', COALESCE(custos_por_cnpj, '[]'::json),
        'evolucaoMensal', COALESCE(evolucao_mensal, '[]'::json),
        'distribuicaoCargos', COALESCE(distribuicao_cargos, '[]'::json),
        'planoPrincipal', plano_principal
    ) INTO result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Em caso de erro, retornar estrutura básica
    RETURN json_build_object(
        'custoMensalTotal', 0,
        'totalCnpjs', 0,
        'totalFuncionarios', 0,
        'funcionariosAtivos', 0,
        'funcionariosPendentes', 0,
        'custosPorCnpj', '[]'::json,
        'evolucaoMensal', '[]'::json,
        'distribuicaoCargos', '[]'::json,
        'planoPrincipal', null,
        'error', SQLERRM
    );
END;
$$;

-- Esta versão restaura os dados básicos do dashboard
-- Vamos corrigir os cálculos corretos depois que os dados voltarem
