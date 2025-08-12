
-- RPC: empresas com planos por tipo para a corretora informada
CREATE OR REPLACE FUNCTION public.get_empresas_com_planos_por_tipo(
    p_tipo_seguro TEXT,
    p_corretora_id UUID
)
RETURNS TABLE (
    id UUID,
    nome TEXT,
    total_planos_ativos BIGINT
)
LANGUAGE sql
AS $$
    SELECT
        e.id,
        e.nome,
        COUNT(DISTINCT p.id) AS total_planos_ativos
    FROM
        public.empresas e
    JOIN
        public.cnpjs c ON e.id = c.empresa_id
    JOIN
        public.dados_planos p ON c.id = p.cnpj_id
    WHERE
        e.corretora_id = p_corretora_id
        AND p.tipo_seguro = p_tipo_seguro
    GROUP BY
        e.id, e.nome
    ORDER BY
        e.nome;
$$;
