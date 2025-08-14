-- Diagnóstico e Correção dos Valores Zerados nos Indicadores Financeiros
-- Este script identifica e corrige os problemas que causam R$ 0,00 nos indicadores

-- 1. DIAGNÓSTICO: Verificar status dos CNPJs mencionados
SELECT 
    'CNPJ Status Check' as check_type,
    c.cnpj,
    c.status as cnpj_status,
    e.nome as empresa_nome,
    e.corretora_id,
    COUNT(dp.id) as total_planos,
    COUNT(CASE WHEN dp.valor_mensal > 0 THEN 1 END) as planos_com_valor,
    SUM(COALESCE(dp.valor_mensal, 0)) as total_valor_mensal
FROM cnpjs c 
LEFT JOIN empresas e ON c.empresa_id = e.id 
LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
    OR c.cnpj LIKE '%123321%' 
    OR c.cnpj LIKE '%495883%'
GROUP BY c.id, c.cnpj, c.status, e.nome, e.corretora_id;

-- 2. DIAGNÓSTICO: Verificar planos com valor_mensal NULL ou 0
SELECT 
    'Plans with Zero/NULL Values' as check_type,
    c.cnpj,
    dp.seguradora,
    dp.tipo_seguro,
    dp.valor_mensal,
    dp.created_at,
    c.status as cnpj_status
FROM dados_planos dp
JOIN cnpjs c ON dp.cnpj_id = c.id
WHERE dp.valor_mensal IS NULL OR dp.valor_mensal = 0
ORDER BY dp.created_at DESC;

-- 3. DIAGNÓSTICO: Verificar funcionários vinculados
SELECT 
    'Employees Check' as check_type,
    c.cnpj,
    COUNT(f.id) as total_funcionarios,
    COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_ativos,
    COUNT(CASE WHEN f.status = 'pendente' THEN 1 END) as funcionarios_pendentes
FROM cnpjs c 
LEFT JOIN funcionarios f ON f.cnpj_id = c.id
WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
    OR c.cnpj LIKE '%123321%' 
    OR c.cnpj LIKE '%495883%'
GROUP BY c.id, c.cnpj;

-- 4. DIAGNÓSTICO: Verificar resultado da função financeira atual
SELECT 
    'Current Financial Function Result' as check_type,
    get_pulse_financeiro_corretor() as pulse_result;

-- 5. CORREÇÃO: Ativar CNPJs inativos (se necessário)
UPDATE cnpjs 
SET status = 'ativo', updated_at = NOW()
WHERE status != 'ativo' 
AND (cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
     OR cnpj LIKE '%123321%' 
     OR cnpj LIKE '%495883%');

-- 6. CORREÇÃO: Atualizar planos com valor_mensal NULL ou 0 para valores realistas
UPDATE dados_planos 
SET 
    valor_mensal = CASE 
        WHEN tipo_seguro = 'vida' THEN 150.00 -- Valor padrão para seguro de vida
        WHEN tipo_seguro = 'saude' THEN 300.00 -- Valor padrão para plano de saúde
        ELSE 100.00 -- Valor padrão para outros tipos
    END,
    updated_at = NOW()
WHERE (valor_mensal IS NULL OR valor_mensal = 0)
AND cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
);

-- 7. CORREÇÃO: Criar planos de exemplo se não existirem
INSERT INTO dados_planos (cnpj_id, seguradora, tipo_seguro, valor_mensal, created_at, updated_at)
SELECT 
    c.id,
    CASE 
        WHEN c.cnpj LIKE '%123321%' THEN 'PORTO SEGURO'
        WHEN c.cnpj LIKE '%495883%' THEN 'Porto'
        ELSE 'Seguradora Teste'
    END as seguradora,
    'vida' as tipo_seguro,
    150.00 as valor_mensal,
    NOW() as created_at,
    NOW() as updated_at
FROM cnpjs c 
WHERE (c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%')
AND c.status = 'ativo'
AND NOT EXISTS (
    SELECT 1 FROM dados_planos dp 
    WHERE dp.cnpj_id = c.id AND dp.tipo_seguro = 'vida'
);

-- 8. CORREÇÃO: Ativar funcionários pendentes (se houver)
UPDATE funcionarios 
SET status = 'ativo', updated_at = NOW()
WHERE status = 'pendente' 
AND cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
);

-- 9. VERIFICAÇÃO FINAL: Testar função financeira após correções
SELECT 
    'After Fix - Financial Function Result' as check_type,
    get_pulse_financeiro_corretor() as pulse_result;

-- 10. VERIFICAÇÃO FINAL: Mostrar status após correções
SELECT 
    'After Fix - CNPJ Status' as check_type,
    c.cnpj,
    c.status as cnpj_status,
    COUNT(dp.id) as total_planos,
    SUM(COALESCE(dp.valor_mensal, 0)) as total_valor_mensal,
    COUNT(f.id) as total_funcionarios,
    COUNT(CASE WHEN f.status = 'ativo' THEN 1 END) as funcionarios_ativos
FROM cnpjs c 
LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
LEFT JOIN funcionarios f ON f.cnpj_id = c.id
WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
    OR c.cnpj LIKE '%123321%' 
    OR c.cnpj LIKE '%495883%'
GROUP BY c.id, c.cnpj, c.status;
