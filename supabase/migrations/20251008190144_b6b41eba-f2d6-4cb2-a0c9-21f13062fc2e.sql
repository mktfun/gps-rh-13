-- Função para buscar estatísticas de funcionários de um plano
-- USA SECURITY INVOKER para aplicar RLS corretamente
CREATE OR REPLACE FUNCTION public.get_plano_funcionarios_stats(
    p_plano_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER -- A MÁGICA ESTÁ AQUI
SET search_path = 'public'
AS $$
DECLARE
    v_total INT := 0;
    v_ativos INT := 0;
    v_pendentes INT := 0;
    v_inativos INT := 0;
BEGIN
    SET search_path = 'public';
    
    -- Conta as matrículas por status
    -- A RLS será aplicada automaticamente porque usamos SECURITY INVOKER
    SELECT
        COUNT(*) FILTER (WHERE status = 'ativo'),
        COUNT(*) FILTER (WHERE status = 'pendente' OR status = 'exclusao_solicitada'),
        COUNT(*) FILTER (WHERE status = 'inativo'),
        COUNT(*)
    INTO
        v_ativos,
        v_pendentes,
        v_inativos,
        v_total
    FROM public.planos_funcionarios
    WHERE plano_id = p_plano_id;
    
    RETURN jsonb_build_object(
        'total', v_total,
        'ativos', v_ativos,
        'pendentes', v_pendentes,
        'inativos', v_inativos
    );
END;
$$;