
-- Criar VIEW empresas_com_metricas que agrega dados das empresas com métricas úteis
CREATE OR REPLACE VIEW empresas_com_metricas AS
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
    -- Contagem total de funcionários ativos
    COALESCE(funcionarios_count.total_funcionarios, 0) as total_funcionarios,
    -- Contagem de pendências (funcionários pendentes + exclusão solicitada)
    COALESCE(pendencias_count.total_pendencias, 0) as total_pendencias,
    -- Status geral da empresa baseado nos CNPJs
    CASE 
        WHEN cnpj_status.tem_configuracao_pendente > 0 THEN 'Configuração Pendente'
        ELSE 'Ativo'
    END as status_geral
FROM empresas e
LEFT JOIN (
    -- Subconsulta para contar funcionários ativos
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_funcionarios
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status = 'ativo'
    GROUP BY c.empresa_id
) funcionarios_count ON funcionarios_count.empresa_id = e.id
LEFT JOIN (
    -- Subconsulta para contar pendências
    SELECT 
        c.empresa_id,
        COUNT(f.id) as total_pendencias
    FROM cnpjs c
    LEFT JOIN funcionarios f ON f.cnpj_id = c.id AND f.status IN ('pendente', 'exclusao_solicitada')
    GROUP BY c.empresa_id
) pendencias_count ON pendencias_count.empresa_id = e.id
LEFT JOIN (
    -- Subconsulta para verificar status dos CNPJs
    SELECT 
        empresa_id,
        COUNT(CASE WHEN status = 'configuracao' THEN 1 END) as tem_configuracao_pendente
    FROM cnpjs
    GROUP BY empresa_id
) cnpj_status ON cnpj_status.empresa_id = e.id;

-- Garantir que a VIEW tenha as mesmas permissões RLS da tabela empresas
ALTER VIEW empresas_com_metricas OWNER TO postgres;

-- Permitir que a VIEW seja acessada pelas mesmas políticas RLS da tabela empresas
GRANT SELECT ON empresas_com_metricas TO authenticated;
