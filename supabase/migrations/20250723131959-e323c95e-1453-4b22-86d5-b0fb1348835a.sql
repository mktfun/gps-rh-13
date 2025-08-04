
CREATE OR REPLACE FUNCTION public.get_empresa_dashboard_metrics()
RETURNS jsonb AS $$
DECLARE
    v_empresa_id uuid := get_my_empresa_id();
    v_solicitacoes_pendentes_count int;
    v_funcionarios_travados_count int;
    -- Adicionar futuramente: v_acoes_rejeitadas_count, v_documentos_pendentes_count
BEGIN
    -- Contagem de solicitações de exclusão aguardando análise da corretora
    SELECT count(f.id)
    INTO v_solicitacoes_pendentes_count
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = v_empresa_id AND f.status = 'exclusao_solicitada';

    -- Contagem de funcionários pendentes de ativação há mais de 5 dias
    SELECT count(f.id)
    INTO v_funcionarios_travados_count
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    WHERE c.empresa_id = v_empresa_id 
      AND f.status = 'pendente' 
      AND f.created_at < (now() - interval '5 days');

    -- Retorna o objeto JSON completo
    RETURN jsonb_build_object(
        'solicitacoes_pendentes_count', v_solicitacoes_pendentes_count,
        'funcionarios_travados_count', v_funcionarios_travados_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões para usuários autenticados
GRANT EXECUTE ON FUNCTION public.get_empresa_dashboard_metrics() TO authenticated;
