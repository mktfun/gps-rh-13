
CREATE OR REPLACE FUNCTION get_operational_metrics_corretor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        'produtividade_carteira', (
            -- % de empresas com pelo menos um plano ativo
            CASE 
                WHEN COUNT(DISTINCT e.id) > 0 THEN
                    ROUND((COUNT(DISTINCT CASE WHEN dp.id IS NOT NULL THEN e.id END)::numeric / COUNT(DISTINCT e.id)::numeric) * 100, 1)
                ELSE 0
            END
        ),
        'eficiencia_ativacao', (
            -- Tempo médio em dias para ativar funcionários pendentes
            SELECT COALESCE(ROUND(AVG(EXTRACT(epoch FROM (NOW() - f.created_at)) / 86400), 1), 0)
            FROM funcionarios f
            INNER JOIN cnpjs c ON f.cnpj_id = c.id
            INNER JOIN empresas e ON c.empresa_id = e.id
            WHERE e.corretora_id = v_corretora_id 
            AND f.status = 'pendente'
            AND f.created_at >= NOW() - INTERVAL '30 days'
        ),
        'qualidade_gestao', (
            -- % de funcionários sem pendências
            CASE 
                WHEN COUNT(f.id) > 0 THEN
                    ROUND((COUNT(CASE WHEN f.status = 'ativo' THEN 1 END)::numeric / COUNT(f.id)::numeric) * 100, 1)
                ELSE 100
            END
        ),
        'crescimento_carteira', (
            -- Saldo de novos funcionários vs desligamentos no mês atual
            (SELECT COUNT(*) FROM funcionarios f
             INNER JOIN cnpjs c ON f.cnpj_id = c.id
             INNER JOIN empresas e ON c.empresa_id = e.id
             WHERE e.corretora_id = v_corretora_id 
             AND f.created_at >= DATE_TRUNC('month', NOW())) -
            (SELECT COUNT(*) FROM funcionarios f
             INNER JOIN cnpjs c ON f.cnpj_id = c.id
             INNER JOIN empresas e ON c.empresa_id = e.id
             WHERE e.corretora_id = v_corretora_id 
             AND f.status = 'arquivado'
             AND f.data_exclusao >= DATE_TRUNC('month', NOW()))
        ),
        'velocidade_resposta', (
            -- Pendências resolvidas nos últimos 7 dias
            SELECT COUNT(*)
            FROM funcionarios f
            INNER JOIN cnpjs c ON f.cnpj_id = c.id
            INNER JOIN empresas e ON c.empresa_id = e.id
            WHERE e.corretora_id = v_corretora_id 
            AND f.status = 'ativo'
            AND f.updated_at >= NOW() - INTERVAL '7 days'
            AND f.created_at < NOW() - INTERVAL '7 days'
        ),
        'cobertura_seguros', (
            -- % de CNPJs com pelo menos um plano ativo
            CASE 
                WHEN COUNT(DISTINCT c.id) > 0 THEN
                    ROUND((COUNT(DISTINCT CASE WHEN dp.id IS NOT NULL THEN c.id END)::numeric / COUNT(DISTINCT c.id)::numeric) * 100, 1)
                ELSE 0
            END
        ),
        'alertas', jsonb_build_object(
            'funcionarios_travados', (
                -- Funcionários há mais de 5 dias pendentes
                SELECT COUNT(*)
                FROM funcionarios f
                INNER JOIN cnpjs c ON f.cnpj_id = c.id
                INNER JOIN empresas e ON c.empresa_id = e.id
                WHERE e.corretora_id = v_corretora_id 
                AND f.status = 'pendente'
                AND f.created_at < NOW() - INTERVAL '5 days'
            ),
            'cnpjs_sem_plano', (
                -- CNPJs ativos sem nenhum plano configurado
                SELECT COUNT(DISTINCT c.id)
                FROM cnpjs c
                INNER JOIN empresas e ON c.empresa_id = e.id
                LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
                WHERE e.corretora_id = v_corretora_id 
                AND c.status = 'ativo'
                AND dp.id IS NULL
            ),
            'empresas_inativas', (
                -- Empresas sem movimentações há mais de 15 dias
                SELECT COUNT(DISTINCT e.id)
                FROM empresas e
                LEFT JOIN cnpjs c ON c.empresa_id = e.id
                LEFT JOIN funcionarios f ON f.cnpj_id = c.id
                WHERE e.corretora_id = v_corretora_id
                AND (f.updated_at IS NULL OR f.updated_at < NOW() - INTERVAL '15 days')
                GROUP BY e.id
            )
        )
    ) INTO v_result
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id;

    RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;
