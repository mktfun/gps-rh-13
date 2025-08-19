-- Função corrigida para calcular corretamente os custos por CNPJ
-- Corrige o problema de cálculos incorretos nos valores de planos de saúde

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
    
    -- CORREÇÃO: Cálculo correto de custos por CNPJ
    -- Para planos de saúde: conta apenas funcionários vinculados ao plano × R$ 200
    -- Para outros planos: usa valor_mensal configurado
    WITH cnpj_custos AS (
        SELECT 
            c.id as cnpj_id,
            c.cnpj,
            c.razao_social,
            COUNT(DISTINCT f.id) as funcionarios_count,
            COALESCE(SUM(
                CASE 
                    WHEN dp.tipo_seguro = 'saude' THEN 
                        -- Para planos de saúde: calcular baseado em funcionários ativos no plano
                        COALESCE(funcionarios_no_plano.count, 0) * 200
                    ELSE 
                        -- Para outros tipos: usar valor configurado
                        COALESCE(dp.valor_mensal, 0)
                END
            ), 0) as valor_mensal_total
        FROM cnpjs c
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        LEFT JOIN LATERAL (
            -- Contar funcionários ativos especificamente vinculados a este plano
            SELECT COUNT(*) as count
            FROM planos_funcionarios pf
            WHERE pf.plano_id = dp.id 
              AND pf.status = 'ativo'
        ) funcionarios_no_plano ON dp.tipo_seguro = 'saude'
        WHERE c.empresa_id = p_empresa_id
          AND c.status = 'ativo'
        GROUP BY c.id, c.cnpj, c.razao_social
    )
    SELECT json_agg(
        json_build_object(
            'cnpj', cnpj,
            'razao_social', razao_social,
            'valor_mensal', valor_mensal_total,
            'funcionarios_count', funcionarios_count
        )
    ) INTO custos_por_cnpj
    FROM cnpj_custos;
    
    -- Calcular custo mensal total corrigido
    SELECT COALESCE(SUM(valor_mensal_total), 0) INTO custo_mensal_total
    FROM (
        SELECT 
            CASE 
                WHEN dp.tipo_seguro = 'saude' THEN 
                    -- Para planos de saúde: calcular baseado em funcionários ativos no plano
                    COALESCE(funcionarios_no_plano.count, 0) * 200
                ELSE 
                    -- Para outros tipos: usar valor configurado
                    COALESCE(dp.valor_mensal, 0)
            END as valor_mensal_total
        FROM dados_planos dp
        JOIN cnpjs c ON dp.cnpj_id = c.id
        LEFT JOIN LATERAL (
            -- Contar funcionários ativos especificamente vinculados a este plano
            SELECT COUNT(*) as count
            FROM planos_funcionarios pf
            WHERE pf.plano_id = dp.id 
              AND pf.status = 'ativo'
        ) funcionarios_no_plano ON dp.tipo_seguro = 'saude'
        WHERE c.empresa_id = p_empresa_id
          AND c.status = 'ativo'
    ) custos_calculados;
    
    -- Evolução mensal (últimos 6 meses)
    SELECT json_agg(
        json_build_object(
            'mes', to_char(date_trunc('month', created_at), 'YYYY-MM'),
            'funcionarios', COUNT(*),
            'custo', COALESCE(SUM(
                CASE 
                    WHEN dp.tipo_seguro = 'saude' THEN 200
                    ELSE COALESCE(dp.valor_mensal, 0)
                END
            ), 0)
        ) ORDER BY date_trunc('month', created_at)
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
        'valor_mensal', CASE 
            WHEN dp.tipo_seguro = 'saude' THEN 
                COALESCE(funcionarios_no_plano.count, 0) * 200
            ELSE 
                COALESCE(dp.valor_mensal, 0)
        END,
        'cobertura_morte', COALESCE(dp.cobertura_morte, 0),
        'cobertura_morte_acidental', COALESCE(dp.cobertura_morte_acidental, 0),
        'cobertura_invalidez_acidente', COALESCE(dp.cobertura_invalidez_acidente, 0),
        'razao_social', c.razao_social,
        'tipo_seguro', dp.tipo_seguro
    ) INTO plano_principal
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    LEFT JOIN LATERAL (
        SELECT COUNT(*) as count
        FROM planos_funcionarios pf
        WHERE pf.plano_id = dp.id 
          AND pf.status = 'ativo'
    ) funcionarios_no_plano ON dp.tipo_seguro = 'saude'
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY CASE 
        WHEN dp.tipo_seguro = 'saude' THEN 
            COALESCE(funcionarios_no_plano.count, 0) * 200
        ELSE 
            COALESCE(dp.valor_mensal, 0)
    END DESC
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

-- Comentários sobre as correções implementadas:
/*
1. CORREÇÃO PRINCIPAL: Para planos de saúde (tipo_seguro = 'saude'):
   - Conta apenas funcionários ativos vinculados especificamente ao plano via tabela planos_funcionarios
   - Multiplica por R$ 200 por funcionário
   - Antes estava contando TODOS os funcionários do CNPJ, gerando valores incorretos

2. Para outros tipos de plano:
   - Mantém o valor_mensal configurado na tabela dados_planos
   
3. Custo mensal total:
   - Agora é a soma dos valores corrigidos de todos os planos
   
4. Custos por CNPJ:
   - Agrupa corretamente por CNPJ e soma os valores dos diferentes planos
   - Mostra a contagem correta de funcionários

5. Tratamento de erro:
   - Adiciona tratamento para retornar estrutura válida mesmo em caso de erro
*/
