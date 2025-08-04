
-- Corrigir a função RPC get_corretora_dashboard_metrics
-- O problema é que status é um enum funcionario_status, então precisa fazer cast para text antes do REPLACE

CREATE OR REPLACE FUNCTION public.get_corretora_dashboard_metrics()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_total_empresas int;
    v_total_cnpjs int;
    v_total_funcionarios int;
    v_total_pendencias int;
BEGIN
    -- Total de Empresas da Corretora
    SELECT count(*)
    INTO v_total_empresas
    FROM public.empresas
    WHERE corretora_id = v_corretora_id;

    -- Total de CNPJs da Corretora
    SELECT count(c.id)
    INTO v_total_cnpjs
    FROM public.cnpjs c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id;

    -- Total de Funcionários (Vidas) da Corretora
    SELECT count(f.id)
    INTO v_total_funcionarios
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id AND f.status NOT IN ('desativado', 'arquivado');

    -- Total de Pendências (funcionários pendentes + exclusões solicitadas)
    SELECT count(f.id)
    INTO v_total_pendencias
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id AND f.status::text IN ('pendente', 'exclusao_solicitada');

    -- Retorna o objeto JSON completo
    RETURN jsonb_build_object(
        'total_empresas', v_total_empresas,
        'total_cnpjs', v_total_cnpjs,
        'total_funcionarios', v_total_funcionarios,
        'total_pendencias', v_total_pendencias
    );
END;
$function$;
