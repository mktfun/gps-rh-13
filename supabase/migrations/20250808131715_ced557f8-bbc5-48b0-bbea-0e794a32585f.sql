
-- Atualizar função de relatório de custos detalhado
DROP FUNCTION IF EXISTS public.get_detailed_costs_report(uuid, date, date);

CREATE OR REPLACE FUNCTION public.get_detailed_costs_report(
    p_empresa_id uuid,
    p_start_date date,
    p_end_date date
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
    v_custo_total_periodo numeric := 0;
    v_custo_medio_funcionario numeric := 0;
    v_variacao_percentual numeric := 0;
    v_total_funcionarios_ativos int := 0;
BEGIN
    -- Calcular KPIs principais
    WITH planos_ativos_periodo AS (
        SELECT DISTINCT
            dp.cnpj_id,
            dp.valor_mensal,
            c.razao_social
        FROM dados_planos dp
        INNER JOIN cnpjs c ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND dp.created_at::date <= p_end_date
        AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
    ),
    funcionarios_ativos_periodo AS (
        SELECT COUNT(DISTINCT f.id) as total
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND f.created_at::date <= p_end_date
        AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date)
        AND f.status IN ('ativo', 'pendente')
    )
    SELECT 
        COALESCE(SUM(pa.valor_mensal), 0),
        fa.total
    INTO v_custo_total_periodo, v_total_funcionarios_ativos
    FROM planos_ativos_periodo pa
    CROSS JOIN funcionarios_ativos_periodo fa;

    -- Calcular custo médio por funcionário
    IF v_total_funcionarios_ativos > 0 THEN
        v_custo_medio_funcionario := v_custo_total_periodo / v_total_funcionarios_ativos;
    END IF;

    -- Calcular variação percentual (comparar com período anterior)
    DECLARE
        v_periodo_anterior_inicio date := p_start_date - (p_end_date - p_start_date + 1);
        v_periodo_anterior_fim date := p_start_date - 1;
        v_custo_periodo_anterior numeric := 0;
    BEGIN
        WITH planos_periodo_anterior AS (
            SELECT DISTINCT
                dp.cnpj_id,
                dp.valor_mensal
            FROM dados_planos dp
            INNER JOIN cnpjs c ON dp.cnpj_id = c.id
            WHERE c.empresa_id = p_empresa_id
            AND dp.created_at::date <= v_periodo_anterior_fim
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > v_periodo_anterior_inicio))
        )
        SELECT COALESCE(SUM(valor_mensal), 0)
        INTO v_custo_periodo_anterior
        FROM planos_periodo_anterior;

        IF v_custo_periodo_anterior > 0 THEN
            v_variacao_percentual := ((v_custo_total_periodo - v_custo_periodo_anterior) / v_custo_periodo_anterior) * 100;
        END IF;
    END;

    -- Montar resultado completo
    WITH evolucao_temporal AS (
        SELECT 
            to_char(mes_data, 'YYYY-MM') as mes,
            to_char(mes_data, 'Mon YYYY') as mes_nome,
            COALESCE(custo_mes.custo_total, 0) as custo_total,
            COALESCE(func_mes.funcionarios, 0) as funcionarios
        FROM (
            SELECT generate_series(
                date_trunc('month', p_start_date), 
                date_trunc('month', p_end_date), 
                '1 month'::interval
            ) as mes_data
        ) meses
        LEFT JOIN (
            SELECT 
                date_trunc('month', mes_ref) as mes,
                SUM(valor_mensal) as custo_total
            FROM (
                SELECT DISTINCT
                    dp.cnpj_id,
                    dp.valor_mensal,
                    generate_series(
                        GREATEST(date_trunc('month', dp.created_at), date_trunc('month', p_start_date::timestamp)),
                        LEAST(
                            CASE 
                                WHEN c.status = 'ativo' THEN date_trunc('month', p_end_date::timestamp)
                                ELSE date_trunc('month', c.updated_at) - interval '1 month'
                            END,
                            date_trunc('month', p_end_date::timestamp)
                        ),
                        '1 month'::interval
                    ) as mes_ref
                FROM dados_planos dp
                INNER JOIN cnpjs c ON dp.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id
                AND dp.created_at::date <= p_end_date
            ) planos_por_mes
            GROUP BY date_trunc('month', mes_ref)
        ) custo_mes ON meses.mes_data = custo_mes.mes
        LEFT JOIN (
            SELECT 
                date_trunc('month', mes_ref) as mes,
                COUNT(DISTINCT funcionario_id) as funcionarios
            FROM (
                SELECT 
                    f.id as funcionario_id,
                    generate_series(
                        GREATEST(date_trunc('month', f.created_at), date_trunc('month', p_start_date::timestamp)),
                        LEAST(
                            CASE 
                                WHEN f.data_exclusao IS NULL THEN date_trunc('month', p_end_date::timestamp)
                                ELSE date_trunc('month', f.data_exclusao) - interval '1 month'
                            END,
                            date_trunc('month', p_end_date::timestamp)
                        ),
                        '1 month'::interval
                    ) as mes_ref
                FROM funcionarios f
                INNER JOIN cnpjs c ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id
                AND f.created_at::date <= p_end_date
                AND f.status IN ('ativo', 'pendente')
            ) func_por_mes
            GROUP BY date_trunc('month', mes_ref)
        ) func_mes ON meses.mes_data = func_mes.mes
        ORDER BY mes_data
    ),
    distribuicao_cnpjs AS (
        SELECT 
            c.cnpj,
            c.razao_social,
            COALESCE(dp.valor_mensal, 0) as valor_mensal,
            COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) as funcionarios_ativos,
            CASE 
                WHEN COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) > 0
                THEN COALESCE(dp.valor_mensal, 0) / COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END)
                ELSE 0
            END as custo_por_funcionario,
            CASE 
                WHEN v_custo_total_periodo > 0 
                THEN ROUND((COALESCE(dp.valor_mensal, 0) / v_custo_total_periodo) * 100, 2)
                ELSE 0
            END as percentual_total
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON c.id = dp.cnpj_id 
            AND dp.created_at::date <= p_end_date
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
        LEFT JOIN funcionarios f ON c.id = f.cnpj_id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY c.id, c.cnpj, c.razao_social, dp.valor_mensal
        HAVING COALESCE(dp.valor_mensal, 0) > 0
        ORDER BY c.razao_social
    ),
    tabela_detalhada AS (
        SELECT 
            c.id as cnpj_id,
            c.cnpj,
            c.razao_social,
            COALESCE(dp.seguradora, 'N/A') as seguradora,
            COALESCE(dp.valor_mensal, 0) as valor_mensal,
            COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) as funcionarios_ativos,
            CASE 
                WHEN COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END) > 0
                THEN COALESCE(dp.valor_mensal, 0) / COUNT(CASE WHEN f.status IN ('ativo', 'pendente') AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN f.id END)
                ELSE 0
            END as custo_por_funcionario,
            COALESCE(dp.created_at::date, c.created_at::date) as data_inicio_plano,
            COALESCE(dp.tipo_seguro::text, 'vida') as tipo_seguro
        FROM cnpjs c
        LEFT JOIN dados_planos dp ON c.id = dp.cnpj_id 
            AND dp.created_at::date <= p_end_date
            AND (c.status = 'ativo' OR (c.status != 'ativo' AND c.updated_at::date > p_start_date))
        LEFT JOIN funcionarios f ON c.id = f.cnpj_id
        WHERE c.empresa_id = p_empresa_id
        GROUP BY c.id, c.cnpj, c.razao_social, dp.seguradora, dp.valor_mensal, dp.created_at, dp.tipo_seguro
        HAVING COALESCE(dp.valor_mensal, 0) > 0
        ORDER BY c.razao_social
    )
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'custo_total_periodo', v_custo_total_periodo,
            'custo_medio_funcionario', v_custo_medio_funcionario,
            'variacao_percentual', v_variacao_percentual,
            'total_funcionarios_ativos', v_total_funcionarios_ativos
        ),
        'evolucao_temporal', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'mes', et.mes,
                    'mes_nome', et.mes_nome,
                    'custo_total', et.custo_total,
                    'funcionarios', et.funcionarios
                )
                ORDER BY et.mes
            )
            FROM evolucao_temporal et
        ), '[]'::jsonb),
        'distribuicao_cnpjs', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cnpj', dc.cnpj,
                    'razao_social', dc.razao_social,
                    'valor_mensal', dc.valor_mensal,
                    'funcionarios_ativos', dc.funcionarios_ativos,
                    'custo_por_funcionario', dc.custo_por_funcionario,
                    'percentual_total', dc.percentual_total
                )
            )
            FROM distribuicao_cnpjs dc
        ), '[]'::jsonb),
        'tabela_detalhada', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cnpj_id', td.cnpj_id,
                    'cnpj', td.cnpj,
                    'razao_social', td.razao_social,
                    'seguradora', td.seguradora,
                    'valor_mensal', td.valor_mensal,
                    'funcionarios_ativos', td.funcionarios_ativos,
                    'custo_por_funcionario', td.custo_por_funcionario,
                    'data_inicio_plano', td.data_inicio_plano,
                    'tipo_seguro', td.tipo_seguro
                )
            )
            FROM tabela_detalhada td
        ), '[]'::jsonb),
        'periodo', jsonb_build_object(
            'inicio', p_start_date,
            'fim', p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Atualizar função de relatório de funcionários
DROP FUNCTION IF EXISTS public.get_funcionarios_report(uuid, date, date, text, uuid, text);

CREATE OR REPLACE FUNCTION public.get_funcionarios_report(
    p_empresa_id uuid,
    p_start_date date DEFAULT NULL,
    p_end_date date DEFAULT NULL,
    p_status_filter text DEFAULT NULL,
    p_cnpj_filter uuid DEFAULT NULL,
    p_search_term text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result jsonb;
    v_total_funcionarios int := 0;
    v_funcionarios_ativos int := 0;
    v_funcionarios_inativos int := 0;
    v_taxa_cobertura numeric := 0;
BEGIN
    -- Definir período padrão se não fornecido
    IF p_start_date IS NULL THEN
        p_start_date := date_trunc('month', CURRENT_DATE - interval '5 months')::date;
    END IF;
    
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    -- KPIs básicos - considerar funcionários ativos no período
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN f.status::text = 'ativo' AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN 1 END) as ativos,
        COUNT(CASE WHEN f.status::text != 'ativo' OR (f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date) THEN 1 END) as inativos
    INTO v_total_funcionarios, v_funcionarios_ativos, v_funcionarios_inativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = p_empresa_id
    AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
    AND (p_status_filter IS NULL OR f.status::text = p_status_filter)
    AND (p_search_term IS NULL OR f.nome ILIKE '%' || p_search_term || '%' OR f.cpf ILIKE '%' || p_search_term || '%');

    -- Taxa de cobertura
    IF v_total_funcionarios > 0 THEN
        v_taxa_cobertura := (v_funcionarios_ativos::numeric / v_total_funcionarios::numeric) * 100;
    END IF;

    -- Montar resultado JSON completo
    WITH evolucao_temporal AS (
        SELECT 
            to_char(mes_data, 'YYYY-MM') as mes,
            to_char(mes_data, 'Mon YYYY') as mes_nome,
            COALESCE(stats.funcionarios_ativos, 0) as funcionarios_ativos,
            COALESCE(stats.funcionarios_inativos, 0) as funcionarios_inativos,
            COALESCE(stats.novas_contratacoes, 0) as novas_contratacoes,
            COALESCE(stats.desligamentos, 0) as desligamentos
        FROM (
            SELECT generate_series(
                date_trunc('month', p_start_date), 
                date_trunc('month', p_end_date), 
                '1 month'::interval
            ) as mes_data
        ) meses
        LEFT JOIN (
            SELECT 
                date_trunc('month', mes_ref) as mes,
                COUNT(CASE WHEN ativo_no_mes THEN 1 END) as funcionarios_ativos,
                COUNT(CASE WHEN NOT ativo_no_mes THEN 1 END) as funcionarios_inativos,
                COUNT(CASE WHEN date_trunc('month', f.created_at) = date_trunc('month', mes_ref) THEN 1 END) as novas_contratacoes,
                COUNT(CASE WHEN f.data_exclusao IS NOT NULL AND date_trunc('month', f.data_exclusao) = date_trunc('month', mes_ref) THEN 1 END) as desligamentos
            FROM (
                SELECT 
                    f.*,
                    generate_series(
                        GREATEST(date_trunc('month', f.created_at), date_trunc('month', p_start_date::timestamp)),
                        LEAST(
                            CASE 
                                WHEN f.data_exclusao IS NULL THEN date_trunc('month', p_end_date::timestamp)
                                ELSE date_trunc('month', f.data_exclusao)
                            END,
                            date_trunc('month', p_end_date::timestamp)
                        ),
                        '1 month'::interval
                    ) as mes_ref,
                    CASE 
                        WHEN f.data_exclusao IS NULL OR date_trunc('month', f.data_exclusao) > date_trunc('month', generate_series(
                            GREATEST(date_trunc('month', f.created_at), date_trunc('month', p_start_date::timestamp)),
                            LEAST(
                                CASE 
                                    WHEN f.data_exclusao IS NULL THEN date_trunc('month', p_end_date::timestamp)
                                    ELSE date_trunc('month', f.data_exclusao)
                                END,
                                date_trunc('month', p_end_date::timestamp)
                            ),
                            '1 month'::interval
                        ))
                        THEN true
                        ELSE false
                    END as ativo_no_mes
                FROM funcionarios f
                INNER JOIN cnpjs c ON f.cnpj_id = c.id
                WHERE c.empresa_id = p_empresa_id
                AND f.created_at::date <= p_end_date
                AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
            ) f
            GROUP BY date_trunc('month', mes_ref)
        ) stats ON meses.mes_data = stats.mes
        ORDER BY mes_data
    ),
    distribuicao_status AS (
        SELECT 
            CASE 
                WHEN f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date THEN 'inativo'
                ELSE f.status::text
            END as status,
            COUNT(*) as quantidade,
            CASE 
                WHEN v_total_funcionarios > 0 THEN ROUND((COUNT(*)::numeric / v_total_funcionarios::numeric) * 100, 2)
                ELSE 0
            END as percentual
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
        GROUP BY CASE 
            WHEN f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date THEN 'inativo'
            ELSE f.status::text
        END
    ),
    funcionarios_por_cnpj AS (
        SELECT 
            c.cnpj,
            c.razao_social,
            COUNT(CASE WHEN f.status::text = 'ativo' AND f.created_at::date <= p_end_date AND (f.data_exclusao IS NULL OR f.data_exclusao::date > p_start_date) THEN 1 END) as funcionarios_ativos,
            COUNT(CASE WHEN f.status::text != 'ativo' OR (f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date) THEN 1 END) as funcionarios_inativos,
            COUNT(f.id) as total
        FROM cnpjs c
        LEFT JOIN funcionarios f ON c.id = f.cnpj_id
        WHERE c.empresa_id = p_empresa_id
        AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
        GROUP BY c.id, c.cnpj, c.razao_social
        ORDER BY c.razao_social
    ),
    tabela_detalhada AS (
        SELECT 
            f.id,
            f.nome as nome_completo,
            f.cpf,
            c.cnpj,
            c.razao_social,
            CASE 
                WHEN f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date THEN 'inativo'
                ELSE f.status::text
            END as status,
            f.created_at::date as data_admissao,
            COALESCE(f.created_at::date, f.created_at::date) as data_ativacao_seguro,
            COALESCE(dp.valor_mensal, 0) as valor_individual,
            0 as total_dependentes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
        AND (p_status_filter IS NULL OR (
            CASE 
                WHEN f.data_exclusao IS NOT NULL AND f.data_exclusao::date <= p_end_date THEN 'inativo'
                ELSE f.status::text
            END
        ) = p_status_filter)
        AND (p_search_term IS NULL OR f.nome ILIKE '%' || p_search_term || '%' OR f.cpf ILIKE '%' || p_search_term || '%')
        ORDER BY f.nome
    )
    SELECT jsonb_build_object(
        'kpis', jsonb_build_object(
            'total_funcionarios', v_total_funcionarios,
            'funcionarios_ativos', v_funcionarios_ativos,
            'funcionarios_inativos', v_funcionarios_inativos,
            'taxa_cobertura', v_taxa_cobertura
        ),
        'evolucao_temporal', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'mes', et.mes,
                    'mes_nome', et.mes_nome,
                    'funcionarios_ativos', et.funcionarios_ativos,
                    'funcionarios_inativos', et.funcionarios_inativos,
                    'novas_contratacoes', et.novas_contratacoes,
                    'desligamentos', et.desligamentos
                )
                ORDER BY et.mes
            )
            FROM evolucao_temporal et
        ), '[]'::jsonb),
        'distribuicao_status', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'status', ds.status,
                    'quantidade', ds.quantidade,
                    'percentual', ds.percentual
                )
            )
            FROM distribuicao_status ds
        ), '[]'::jsonb),
        'funcionarios_por_cnpj', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'cnpj', fpc.cnpj,
                    'razao_social', fpc.razao_social,
                    'funcionarios_ativos', fpc.funcionarios_ativos,
                    'funcionarios_inativos', fpc.funcionarios_inativos,
                    'total', fpc.total
                )
            )
            FROM funcionarios_por_cnpj fpc
        ), '[]'::jsonb),
        'tabela_detalhada', COALESCE((
            SELECT jsonb_agg(
                jsonb_build_object(
                    'id', td.id,
                    'nome_completo', td.nome_completo,
                    'cpf', td.cpf,
                    'cnpj', td.cnpj,
                    'razao_social', td.razao_social,
                    'status', td.status,
                    'data_admissao', td.data_admissao,
                    'data_ativacao_seguro', td.data_ativacao_seguro,
                    'valor_individual', td.valor_individual,
                    'total_dependentes', td.total_dependentes
                )
            )
            FROM tabela_detalhada td
        ), '[]'::jsonb),
        'periodo', jsonb_build_object(
            'inicio', p_start_date,
            'fim', p_end_date
        )
    ) INTO v_result;

    RETURN v_result;
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.get_detailed_costs_report(uuid, date, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_funcionarios_report(uuid, date, date, text, uuid, text) TO authenticated;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_dados_planos_created_at ON dados_planos(created_at);
CREATE INDEX IF NOT EXISTS idx_cnpjs_updated_at ON cnpjs(updated_at);
CREATE INDEX IF NOT EXISTS idx_funcionarios_data_exclusao ON funcionarios(data_exclusao) WHERE data_exclusao IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_funcionarios_created_at ON funcionarios(created_at);
