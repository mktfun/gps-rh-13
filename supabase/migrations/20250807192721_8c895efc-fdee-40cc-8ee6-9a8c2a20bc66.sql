
-- Primeiro, a demolição segura
DROP FUNCTION IF EXISTS public.get_funcionarios_report(uuid, date, date, text, uuid, text);

-- Agora, a construção correta
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

    -- KPIs básicos
    SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN f.status::text = 'ativo' THEN 1 END) as ativos,
        COUNT(CASE WHEN f.status::text != 'ativo' THEN 1 END) as inativos
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
            COALESCE(funcionarios_ativos, 0) as funcionarios_ativos,
            COALESCE(funcionarios_inativos, 0) as funcionarios_inativos,
            COALESCE(novas_contratacoes, 0) as novas_contratacoes,
            COALESCE(desligamentos, 0) as desligamentos
        FROM (
            SELECT generate_series(
                date_trunc('month', p_start_date), 
                date_trunc('month', p_end_date), 
                '1 month'::interval
            ) as mes_data
        ) meses
        LEFT JOIN (
            SELECT 
                date_trunc('month', f.created_at) as mes,
                COUNT(CASE WHEN f.status::text = 'ativo' THEN 1 END) as funcionarios_ativos,
                COUNT(CASE WHEN f.status::text != 'ativo' THEN 1 END) as funcionarios_inativos,
                COUNT(*) as novas_contratacoes,
                0 as desligamentos
            FROM funcionarios f
            INNER JOIN cnpjs c ON f.cnpj_id = c.id
            WHERE c.empresa_id = p_empresa_id
            AND f.created_at >= p_start_date
            AND f.created_at <= p_end_date
            AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
            GROUP BY date_trunc('month', f.created_at)
        ) stats ON meses.mes_data = stats.mes
        ORDER BY mes_data
    ),
    distribuicao_status AS (
        SELECT 
            f.status::text as status,
            COUNT(*) as quantidade,
            CASE 
                WHEN v_total_funcionarios > 0 THEN ROUND((COUNT(*)::numeric / v_total_funcionarios::numeric) * 100, 2)
                ELSE 0
            END as percentual
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
        GROUP BY f.status::text
    ),
    funcionarios_por_cnpj AS (
        SELECT 
            c.cnpj,
            c.razao_social,
            COUNT(CASE WHEN f.status::text = 'ativo' THEN 1 END) as funcionarios_ativos,
            COUNT(CASE WHEN f.status::text != 'ativo' THEN 1 END) as funcionarios_inativos,
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
            f.status::text as status,
            f.created_at::date as data_admissao,
            f.created_at::date as data_ativacao_seguro,
            COALESCE(dp.valor_mensal, 0) as valor_individual,
            0 as total_dependentes
        FROM funcionarios f
        INNER JOIN cnpjs c ON f.cnpj_id = c.id
        LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
        WHERE c.empresa_id = p_empresa_id
        AND (p_cnpj_filter IS NULL OR c.id = p_cnpj_filter)
        AND (p_status_filter IS NULL OR f.status::text = p_status_filter)
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
