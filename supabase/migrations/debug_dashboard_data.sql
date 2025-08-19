-- Função de debug para inspecionar dados do dashboard
-- Esta função mostra exatamente que dados existem nas tabelas

CREATE OR REPLACE FUNCTION debug_dashboard_data(p_empresa_id UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    empresa_info JSON;
    cnpjs_info JSON;
    funcionarios_info JSON;
    planos_info JSON;
    planos_funcionarios_info JSON;
BEGIN
    
    -- Se não foi passado empresa_id, pegar o primeiro disponível
    IF p_empresa_id IS NULL THEN
        SELECT id INTO p_empresa_id FROM empresas LIMIT 1;
    END IF;
    
    -- Informações da empresa
    SELECT json_build_object(
        'empresa_id', e.id,
        'empresa_nome', e.nome,
        'empresa_cnpj', e.cnpj,
        'corretora_id', e.corretora_id
    ) INTO empresa_info
    FROM empresas e
    WHERE e.id = p_empresa_id;
    
    -- Informações dos CNPJs
    SELECT json_agg(
        json_build_object(
            'cnpj_id', c.id,
            'cnpj', c.cnpj,
            'razao_social', c.razao_social,
            'status', c.status,
            'empresa_id', c.empresa_id
        )
    ) INTO cnpjs_info
    FROM cnpjs c
    WHERE c.empresa_id = p_empresa_id;
    
    -- Informações dos funcionários
    SELECT json_agg(
        json_build_object(
            'funcionario_id', f.id,
            'nome', f.nome,
            'cpf', f.cpf,
            'status', f.status,
            'cnpj_id', f.cnpj_id,
            'cargo', f.cargo
        )
    ) INTO funcionarios_info
    FROM funcionarios f
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id;
    
    -- Informações dos planos
    SELECT json_agg(
        json_build_object(
            'plano_id', dp.id,
            'cnpj_id', dp.cnpj_id,
            'seguradora', dp.seguradora,
            'tipo_seguro', dp.tipo_seguro,
            'valor_mensal', dp.valor_mensal,
            'cnpj_razao_social', c.razao_social
        )
    ) INTO planos_info
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id;
    
    -- Informações dos vínculos planos-funcionários
    SELECT json_agg(
        json_build_object(
            'vinculo_id', pf.id,
            'plano_id', pf.plano_id,
            'funcionario_id', pf.funcionario_id,
            'status', pf.status,
            'funcionario_nome', f.nome,
            'plano_tipo', dp.tipo_seguro,
            'plano_seguradora', dp.seguradora
        )
    ) INTO planos_funcionarios_info
    FROM planos_funcionarios pf
    JOIN funcionarios f ON pf.funcionario_id = f.id
    JOIN dados_planos dp ON pf.plano_id = dp.id
    JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id;
    
    -- Contar totais para debug rápido
    WITH contadores AS (
        SELECT 
            (SELECT COUNT(*) FROM cnpjs WHERE empresa_id = p_empresa_id) as total_cnpjs,
            (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id) as total_funcionarios,
            (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo') as funcionarios_ativos,
            (SELECT COUNT(*) FROM dados_planos dp JOIN cnpjs c ON dp.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id) as total_planos,
            (SELECT COUNT(*) FROM planos_funcionarios pf JOIN funcionarios f ON pf.funcionario_id = f.id JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id) as total_vinculos,
            (SELECT COALESCE(SUM(dp.valor_mensal), 0) FROM dados_planos dp JOIN cnpjs c ON dp.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id) as soma_valores_planos
    )
    SELECT json_build_object(
        'debug_info', json_build_object(
            'empresa_id_usado', p_empresa_id,
            'total_cnpjs', total_cnpjs,
            'total_funcionarios', total_funcionarios,
            'funcionarios_ativos', funcionarios_ativos,
            'total_planos', total_planos,
            'total_vinculos', total_vinculos,
            'soma_valores_planos', soma_valores_planos
        ),
        'empresa', empresa_info,
        'cnpjs', COALESCE(cnpjs_info, '[]'::json),
        'funcionarios', COALESCE(funcionarios_info, '[]'::json),
        'planos', COALESCE(planos_info, '[]'::json),
        'vinculos_planos_funcionarios', COALESCE(planos_funcionarios_info, '[]'::json)
    ) INTO result
    FROM contadores;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'error', SQLERRM,
        'empresa_id_tentativa', p_empresa_id
    );
END;
$$;

-- Para usar a função de debug:
-- SELECT debug_dashboard_data(); -- Usa primeira empresa
-- SELECT debug_dashboard_data('uuid-da-empresa'); -- Usa empresa específica
