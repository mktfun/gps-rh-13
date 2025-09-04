CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics(p_empresa_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    result json;
    v_custo_mensal_total numeric;
BEGIN
    -- LÓGICA DE CÁLCULO RESTAURADA E CORRIGIDA
    -- Simplesmente soma o valor de cada plano ativo para a empresa.
    SELECT
        COALESCE(SUM(dp.valor_mensal), 0)
    INTO
        v_custo_mensal_total
    FROM dados_planos AS dp
    JOIN cnpjs AS c ON dp.cnpj_id = c.id
    WHERE
        c.empresa_id = p_empresa_id
        AND c.status = 'ativo';

    -- O RESTO DA FUNÇÃO ORIGINAL, QUE JÁ FUNCIONAVA, MANTIDO INTACTO COM CORREÇÕES
    SELECT json_build_object(
        'total_cnpjs', (SELECT COUNT(*) FROM cnpjs WHERE empresa_id = p_empresa_id AND status = 'ativo'),
        'total_funcionarios', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id),
        'funcionarios_ativos', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo'),
        'funcionarios_pendentes', (SELECT COUNT(*) FROM funcionarios f JOIN cnpjs c ON f.cnpj_id = c.id WHERE c.empresa_id = p_empresa_id AND f.status = 'pendente'),
        'custo_mensal_total', v_custo_mensal_total,
        'distribuicao_cargos', (
            SELECT json_agg(cargo_counts)
            FROM (
                SELECT f.cargo, COUNT(*) as count
                FROM funcionarios f
                JOIN cnpjs c ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id AND f.status = 'ativo'
                GROUP BY f.cargo ORDER BY count DESC LIMIT 5
            ) cargo_counts
        ),
        'custos_por_cnpj', (
            SELECT json_agg(cnpj_data)
            FROM (
                SELECT 
                    c.id as cnpj_id,
                    c.cnpj,
                    c.razao_social,
                    COALESCE(dp.valor_mensal, 0) as valor_mensal,
                    COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_count
                FROM cnpjs c
                LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
                LEFT JOIN funcionarios f ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id AND c.status = 'ativo'
                GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
                ORDER BY c.razao_social
            ) cnpj_data
        ),
        'evolucao_mensal', (
            SELECT json_agg(stats ORDER BY mes)
            FROM (
                SELECT
                    TO_CHAR(d.mes, 'YYYY-MM') AS mes,
                    -- Contar funcionários que estavam ativos durante aquele mês específico
                    (
                        SELECT COUNT(DISTINCT f.id) 
                        FROM funcionarios f
                        JOIN cnpjs c ON f.cnpj_id = c.id
                        WHERE c.empresa_id = p_empresa_id
                        -- Funcionário foi criado antes do fim do mês
                        AND f.created_at < (d.mes + interval '1 month')
                        -- Funcionário ainda não foi excluído OU foi excluído depois do início do mês
                        AND (f.data_exclusao IS NULL OR f.data_exclusao >= d.mes)
                        -- Considerar todos os status que indicam que o funcionário estava na empresa
                        AND f.status IN ('ativo', 'pendente', 'arquivado', 'exclusao_solicitada')
                    ) AS funcionarios,
                    -- Calcular custo para planos que estavam ativos durante todo o período
                    (
                        SELECT COALESCE(SUM(dp.valor_mensal), 0)
                        FROM dados_planos dp
                        JOIN cnpjs c ON dp.cnpj_id = c.id
                        WHERE c.empresa_id = p_empresa_id
                        -- Plano foi criado antes do fim do mês
                        AND dp.created_at < (d.mes + interval '1 month')
                        -- CNPJ ainda está ativo OU foi desativado depois deste mês
                        AND (
                            c.status = 'ativo' 
                            OR (
                                c.status != 'ativo' 
                                AND date_trunc('month', c.updated_at) > d.mes
                            )
                        )
                    ) AS custo
                FROM generate_series(
                         date_trunc('month', now() - interval '5 month'),
                         date_trunc('month', now()),
                         '1 month'
                     ) AS d(mes)
            ) stats
        )
    )
    INTO result;

    RETURN result;
END;
$$;