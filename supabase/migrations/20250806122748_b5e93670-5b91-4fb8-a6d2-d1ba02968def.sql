
-- Corrigir a função get_relatorio_financeiro_corretora para calcular corretamente a receita
-- O valor do plano é FIXO por CNPJ, não deve ser multiplicado por funcionários
CREATE OR REPLACE FUNCTION get_relatorio_financeiro_corretora(p_corretora_id uuid)
RETURNS TABLE (
    empresa_id uuid,
    empresa_nome text,
    total_cnpjs_ativos bigint,
    total_funcionarios_segurados bigint,
    custo_total_mensal numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id as empresa_id,
        e.nome as empresa_nome,
        COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND dp.id IS NOT NULL THEN c.id END) as total_cnpjs_ativos,
        COUNT(DISTINCT CASE WHEN f.status IN ('ativo', 'pendente') THEN f.id END) as total_funcionarios_segurados,
        -- CORREÇÃO: Somar apenas os valores dos planos ativos (valor fixo por CNPJ/plano)
        COALESCE(SUM(DISTINCT CASE WHEN c.status = 'ativo' AND dp.id IS NOT NULL THEN dp.valor_mensal ELSE 0 END), 0) as custo_total_mensal
    FROM empresas e
    LEFT JOIN cnpjs c ON c.empresa_id = e.id
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id
    LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
    WHERE e.corretora_id = p_corretora_id
    GROUP BY e.id, e.nome
    HAVING COUNT(DISTINCT CASE WHEN c.status = 'ativo' AND dp.id IS NOT NULL THEN c.id END) > 0
    ORDER BY custo_total_mensal DESC;
END;
$$;
