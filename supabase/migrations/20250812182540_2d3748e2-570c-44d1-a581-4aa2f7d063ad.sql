
-- 1) Unificar contagem na lista de Empresas
-- Substitui a contagem de "pendências" baseada em funcionários por contagem real em 'pendencias' com status 'pendente'
CREATE OR REPLACE FUNCTION public.get_empresas_com_metricas()
RETURNS TABLE(
  id UUID,
  nome TEXT,
  responsavel TEXT,
  email TEXT,
  telefone TEXT,
  corretora_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  primeiro_acesso BOOLEAN,
  total_funcionarios BIGINT,
  total_pendencias BIGINT,
  status_geral TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.nome,
    e.responsavel,
    e.email,
    e.telefone,
    e.corretora_id,
    e.created_at,
    e.updated_at,
    e.primeiro_acesso,
    -- Funcionários ativos (mantido)
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    -- Pendências REAIS da empresa (somente status pendente)
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    -- Status geral baseado em CNPJs
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral
  FROM empresas e
  LEFT JOIN (
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_funcionarios
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
  ) funcionarios_count ON funcionarios_count.empresa_id = e.id
  LEFT JOIN (
    -- Contar pendências a partir da FONTE DA VERDADE
    SELECT 
        c.empresa_id,
        COUNT(p.id) as total_pendencias
    FROM cnpjs c
    JOIN pendencias p ON p.cnpj_id = c.id
    WHERE p.status = 'pendente'
    GROUP BY c.empresa_id
  ) pendencias_count ON pendencias_count.empresa_id = e.id
  LEFT JOIN (
    SELECT 
        empresa_id,
        COUNT(CASE WHEN status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM cnpjs
    GROUP BY empresa_id
  ) cnpj_status ON cnpj_status.empresa_id = e.id
  WHERE e.corretora_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

-- 2) Unificar KPI de pendências no Dashboard da corretora
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
    SELECT count(*) INTO v_total_empresas
    FROM public.empresas
    WHERE corretora_id = v_corretora_id;

    -- Total de CNPJs da Corretora
    SELECT count(c.id) INTO v_total_cnpjs
    FROM public.cnpjs c
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id;

    -- Total de Funcionários (Vidas) da Corretora
    SELECT count(f.id) INTO v_total_funcionarios
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id AND f.status NOT IN ('desativado', 'arquivado');

    -- TOTAL DE PENDÊNCIAS REAIS (status pendente)
    SELECT count(p.id) INTO v_total_pendencias
    FROM public.pendencias p
    WHERE p.corretora_id = v_corretora_id
      AND p.status = 'pendente';

    RETURN jsonb_build_object(
        'total_empresas', v_total_empresas,
        'total_cnpjs', v_total_cnpjs,
        'total_funcionarios', v_total_funcionarios,
        'total_pendencias', v_total_pendencias
    );
END;
$function$;

-- 3) Unificar contadores das Ações Necessárias (totais)
CREATE OR REPLACE FUNCTION public.get_acoes_necessarias_corretora()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_pendencias_exclusao int;
    v_novos_funcionarios int;
    v_configuracao_pendente int;
BEGIN
    -- Exclusões solicitadas (cancelamento) a partir de pendencias
    SELECT count(p.id)
    INTO v_pendencias_exclusao
    FROM public.pendencias p
    WHERE p.corretora_id = v_corretora_id
      AND p.status = 'pendente'
      AND p.tipo = 'cancelamento';

    -- Ativações pendentes a partir de pendencias
    SELECT count(p.id)
    INTO v_novos_funcionarios
    FROM public.pendencias p
    WHERE p.corretora_id = v_corretora_id
      AND p.status = 'pendente'
      AND p.tipo = 'ativacao';

    -- CNPJs em configuração (não é pendência operacional, mantém-se a fonte original)
    SELECT count(DISTINCT e.id)
    INTO v_configuracao_pendente
    FROM public.empresas e
    JOIN public.cnpjs c ON e.id = c.empresa_id
    WHERE e.corretora_id = v_corretora_id
      AND c.status = 'configuracao';

    RETURN jsonb_build_object(
        'pendencias_exclusao', v_pendencias_exclusao,
        'novos_funcionarios', v_novos_funcionarios,
        'configuracao_pendente', v_configuracao_pendente
    );
END;
$function$;

-- 4) Unificar contadores das Smart Actions
CREATE OR REPLACE FUNCTION public.get_smart_actions_corretor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_result jsonb;
BEGIN
    SELECT jsonb_build_object(
        -- Exclusão agora vem de pendencias tipo 'cancelamento'
        'aprovacoes_rapidas', COUNT(CASE WHEN p.tipo = 'cancelamento' AND p.status = 'pendente' THEN 1 END),
        -- Ativações pendentes agora vem de pendencias tipo 'ativacao'
        'ativacoes_pendentes', COUNT(CASE WHEN p.tipo = 'ativacao' AND p.status = 'pendente' THEN 1 END),
        -- Mantém-se cnpjs sem plano como estava
        'cnpjs_sem_plano', COUNT(DISTINCT CASE WHEN dp.id IS NULL AND c.status = 'ativo' THEN c.id END),
        -- "Travados" = pendencias de ativação com mais de 5 dias abertas
        'funcionarios_travados', COUNT(CASE WHEN p.tipo = 'ativacao' AND p.status = 'pendente' AND p.data_criacao < NOW() - INTERVAL '5 days' THEN 1 END)
    ) INTO v_result
    FROM public.cnpjs c
    JOIN public.empresas e ON c.empresa_id = e.id
    LEFT JOIN public.dados_planos dp ON dp.cnpj_id = c.id
    LEFT JOIN public.pendencias p ON p.cnpj_id = c.id
    WHERE e.corretora_id = v_corretora_id;

    RETURN v_result;
END;
$function$;
