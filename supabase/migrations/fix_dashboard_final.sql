-- Função SQL final com cálculos corretos para planos de saúde
-- Esta versão calcula corretamente baseado em funcionários reais vinculados aos planos

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
    
    -- Cálculo correto do custo mensal total
    -- Para planos de saúde: funcionários ativos no plano × 200
    -- Para outros planos: valor configurado
    SELECT COALESCE(SUM(
        CASE 
            WHEN dp.tipo_seguro = 'saude' THEN 
                COALESCE((
                    SELECT COUNT(*)
                    FROM planos_funcionarios pf
                    WHERE pf.plano_id = dp.id 
                      AND pf.status = 'ativo'
                ), 0) * 200
            ELSE 
                COALESCE(dp.valor_mensal, 0)
        END
    ), 0) INTO custo_mensal_total
    FROM dados_planos dp
    JOIN cnpjs c ON dp.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo';
    
    -- Custos por CNPJ com cálculo correto
    WITH cnpj_custos AS (
        SELECT 
            c.id as cnpj_id,
            c.cnpj,
            c.razao_social,
            COUNT(DISTINCT f.id) as funcionarios_count,
            COALESCE(SUM(
                CASE 
                    WHEN dp.tipo_seguro = 'saude' THEN 
                        COALESCE((
                            SELECT COUNT(*)
                            FROM planos_funcionarios pf
                            WHERE pf.plano_id = dp.id 
                              AND pf.status = 'ativo'
                        ), 0) * 200
                    ELSE 
                        COALESCE(dp.valor_mensal, 0)
                END
            ), 0) as valor_mensal_total
        FROM cnpjs c
        LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('ativo', 'pendente')
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
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
    
    -- Evolução mensal (últimos 6 meses)
    SELECT json_agg(
        json_build_object(
            'mes', to_char(date_trunc('month', f.created_at), 'YYYY-MM'),
            'funcionarios', COUNT(DISTINCT f.id),
            'custo', COALESCE(SUM(
                CASE 
                    WHEN dp.tipo_seguro = 'saude' THEN 200
                    ELSE COALESCE(dp.valor_mensal, 0)
                END
            ), 0)
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
    
    -- Plano principal com valor corrigido
    SELECT json_build_object(
        'seguradora', dp.seguradora,
        'valor_mensal', CASE 
            WHEN dp.tipo_seguro = 'saude' THEN 
                COALESCE((
                    SELECT COUNT(*)
                    FROM planos_funcionarios pf
                    WHERE pf.plano_id = dp.id 
                      AND pf.status = 'ativo'
                ), 0) * 200
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
    WHERE c.empresa_id = p_empresa_id
      AND c.status = 'ativo'
    ORDER BY CASE 
        WHEN dp.tipo_seguro = 'saude' THEN 
            COALESCE((
                SELECT COUNT(*)
                FROM planos_funcionarios pf
                WHERE pf.plano_id = dp.id 
                  AND pf.status = 'ativo'
            ), 0) * 200
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

-- Comentários sobre as correções:
/*
CORREÇÕES IMPLEMENTADAS:

1. Para planos de saúde (tipo_seguro = 'saude'):
   - Conta funcionários ativos vinculados via tabela planos_funcionarios
   - Multiplica por R$ 200 por funcionário
   - Usa subquery para contar corretamente

2. Para outros tipos de plano:
   - Mantém valor_mensal configurado

3. Cálculo por CNPJ:
   - Soma todos os planos do CNPJ com cálculos corretos
   - Mostra contagem real de funcionários do CNPJ

4. Tratamento de erro:
   - Função não quebra se houver problemas
   - Retorna estrutura válida sempre
*/
