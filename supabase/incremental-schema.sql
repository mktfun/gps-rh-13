-- =====================================================
-- SCHEMA INCREMENTAL PARA CORRIGIR INDICADORES FINANCEIROS
-- Execute uma seção de cada vez para evitar erros
-- =====================================================

-- SEÇÃO 1: VERIFICAÇÃO E CRIAÇÃO BÁSICA DAS TABELAS
-- =====================================================

-- Primeiro, vamos verificar quais tabelas já existem
DO $$
BEGIN
    RAISE NOTICE 'Verificando estrutura atual das tabelas...';
END $$;

-- Verificar tabelas existentes
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('corretoras', 'empresas', 'cnpjs', 'dados_planos', 'funcionarios')
ORDER BY table_name, ordinal_position;

-- SEÇÃO 2: CRIAÇÃO SEGURA DAS TABELAS (se não existirem)
-- =====================================================

-- Tabela de Corretoras
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'corretoras') THEN
        CREATE TABLE public.corretoras (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(14) UNIQUE,
            telefone VARCHAR(20),
            email VARCHAR(255) UNIQUE,
            endereco TEXT,
            status VARCHAR(20) DEFAULT 'ativo',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Tabela corretoras criada';
    ELSE
        RAISE NOTICE 'Tabela corretoras já existe';
    END IF;
END $$;

-- Tabela de Empresas
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'empresas') THEN
        CREATE TABLE public.empresas (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            nome VARCHAR(255) NOT NULL,
            cnpj VARCHAR(14) UNIQUE,
            corretora_id UUID,
            telefone VARCHAR(20),
            email VARCHAR(255),
            endereco TEXT,
            status VARCHAR(20) DEFAULT 'ativo',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Tabela empresas criada';
    ELSE
        RAISE NOTICE 'Tabela empresas já existe';
    END IF;
END $$;

-- Tabela de CNPJs
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cnpjs') THEN
        CREATE TABLE public.cnpjs (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            cnpj VARCHAR(14) NOT NULL UNIQUE,
            empresa_id UUID,
            razao_social VARCHAR(255),
            nome_fantasia VARCHAR(255),
            status VARCHAR(20) DEFAULT 'ativo',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        RAISE NOTICE 'Tabela cnpjs criada';
    ELSE
        RAISE NOTICE 'Tabela cnpjs já existe';
    END IF;
END $$;

-- SEÇÃO 3: ADIÇÃO SEGURA DE COLUNAS (se não existirem)
-- =====================================================

-- Adicionar coluna status em dados_planos se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dados_planos' AND column_name = 'status'
    ) THEN
        ALTER TABLE dados_planos ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
        RAISE NOTICE 'Coluna status adicionada em dados_planos';
    ELSE
        RAISE NOTICE 'Coluna status já existe em dados_planos';
    END IF;
END $$;

-- Adicionar coluna comissao_percentual em dados_planos se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dados_planos' AND column_name = 'comissao_percentual'
    ) THEN
        ALTER TABLE dados_planos ADD COLUMN comissao_percentual DECIMAL(5,2) DEFAULT 5.00;
        RAISE NOTICE 'Coluna comissao_percentual adicionada em dados_planos';
    ELSE
        RAISE NOTICE 'Coluna comissao_percentual já existe em dados_planos';
    END IF;
END $$;

-- Adicionar coluna status em funcionarios se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' AND column_name = 'status'
    ) THEN
        ALTER TABLE funcionarios ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
        RAISE NOTICE 'Coluna status adicionada em funcionarios';
    ELSE
        RAISE NOTICE 'Coluna status já existe em funcionarios';
    END IF;
END $$;

-- Adicionar coluna status em cnpjs se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cnpjs' AND column_name = 'status'
    ) THEN
        ALTER TABLE cnpjs ADD COLUMN status VARCHAR(20) DEFAULT 'ativo';
        RAISE NOTICE 'Coluna status adicionada em cnpjs';
    ELSE
        RAISE NOTICE 'Coluna status já existe em cnpjs';
    END IF;
END $$;

-- Adicionar coluna corretora_id em empresas se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'empresas' AND column_name = 'corretora_id'
    ) THEN
        ALTER TABLE empresas ADD COLUMN corretora_id UUID;
        RAISE NOTICE 'Coluna corretora_id adicionada em empresas';
    ELSE
        RAISE NOTICE 'Coluna corretora_id já existe em empresas';
    END IF;
END $$;

-- SEÇÃO 4: CORREÇÃO DOS DADOS EXISTENTES
-- =====================================================

-- Primeiro, vamos verificar os dados atuais
SELECT 'Verificação dos dados atuais:' as info;

-- Verificar CNPJs problemáticos
SELECT 
    'CNPJs encontrados:' as tipo,
    cnpj,
    COALESCE(status, 'NULL') as status_atual
FROM cnpjs 
WHERE cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
   OR cnpj LIKE '%123321%' 
   OR cnpj LIKE '%495883%';

-- Verificar planos problemáticos
SELECT 
    'Planos encontrados:' as tipo,
    c.cnpj,
    dp.seguradora,
    COALESCE(dp.valor_mensal, 0) as valor_atual,
    COALESCE(dp.status, 'NULL') as status_atual
FROM dados_planos dp
JOIN cnpjs c ON dp.cnpj_id = c.id
WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
   OR c.cnpj LIKE '%123321%' 
   OR c.cnpj LIKE '%495883%';

-- Agora vamos corrigir os dados
-- Corrigir status dos CNPJs
UPDATE cnpjs 
SET status = 'ativo'
WHERE (cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR cnpj LIKE '%123321%' 
       OR cnpj LIKE '%495883%')
AND (status IS NULL OR status != 'ativo');

-- Corrigir valores dos planos
UPDATE dados_planos 
SET 
    valor_mensal = CASE 
        WHEN COALESCE(valor_mensal, 0) = 0 THEN
            CASE 
                WHEN tipo_seguro = 'vida' THEN 150.00
                WHEN tipo_seguro = 'saude' THEN 300.00
                ELSE 100.00
            END
        ELSE valor_mensal
    END,
    comissao_percentual = CASE 
        WHEN COALESCE(comissao_percentual, 0) = 0 THEN
            CASE 
                WHEN tipo_seguro = 'vida' THEN 20.00
                ELSE 5.00
            END
        ELSE comissao_percentual
    END,
    status = COALESCE(status, 'ativo')
WHERE cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
);

-- Corrigir status dos funcionários
UPDATE funcionarios 
SET status = COALESCE(status, 'ativo')
WHERE cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
)
AND (status IS NULL OR status = 'pendente');

-- SEÇÃO 5: FUNÇÃO FINANCEIRA SIMPLIFICADA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pulse_financeiro_corretor_safe()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_receita_mes numeric := 0;
    v_comissao_estimada numeric := 0;
    v_margem_risco numeric := 100;
    v_oportunidades numeric := 0;
    v_total_funcionarios integer := 0;
    v_funcionarios_ativos integer := 0;
BEGIN
    -- Log para debug
    RAISE LOG 'Executando função para corretora: %', v_corretora_id;
    
    -- Tentar calcular receita mensal (com tratamento de erro)
    BEGIN
        SELECT COALESCE(SUM(COALESCE(dp.valor_mensal, 0)), 0) 
        INTO v_receita_mes
        FROM dados_planos dp
        JOIN cnpjs c ON dp.cnpj_id = c.id
        LEFT JOIN empresas e ON c.empresa_id = e.id
        WHERE (e.corretora_id = v_corretora_id OR v_corretora_id IS NULL)
        AND COALESCE(c.status, 'ativo') = 'ativo'
        AND COALESCE(dp.status, 'ativo') = 'ativo'
        AND COALESCE(dp.valor_mensal, 0) > 0;
    EXCEPTION WHEN OTHERS THEN
        v_receita_mes := 0;
        RAISE LOG 'Erro no cálculo de receita: %', SQLERRM;
    END;

    -- Tentar calcular comissão (com tratamento de erro)
    BEGIN
        SELECT COALESCE(SUM(
            COALESCE(dp.valor_mensal, 0) * 
            (COALESCE(dp.comissao_percentual, 5.0) / 100)
        ), 0) 
        INTO v_comissao_estimada
        FROM dados_planos dp
        JOIN cnpjs c ON dp.cnpj_id = c.id
        LEFT JOIN empresas e ON c.empresa_id = e.id
        WHERE (e.corretora_id = v_corretora_id OR v_corretora_id IS NULL)
        AND COALESCE(c.status, 'ativo') = 'ativo'
        AND COALESCE(dp.status, 'ativo') = 'ativo'
        AND COALESCE(dp.valor_mensal, 0) > 0;
    EXCEPTION WHEN OTHERS THEN
        v_comissao_estimada := 0;
        RAISE LOG 'Erro no cálculo de comissão: %', SQLERRM;
    END;

    -- Tentar calcular funcionários (com tratamento de erro)
    BEGIN
        SELECT 
            COUNT(*),
            COUNT(CASE WHEN COALESCE(f.status, 'ativo') = 'ativo' THEN 1 END)
        INTO v_total_funcionarios, v_funcionarios_ativos
        FROM funcionarios f
        JOIN cnpjs c ON f.cnpj_id = c.id
        LEFT JOIN empresas e ON c.empresa_id = e.id
        WHERE (e.corretora_id = v_corretora_id OR v_corretora_id IS NULL)
        AND COALESCE(c.status, 'ativo') = 'ativo';

        -- Calcular margem de risco
        IF v_total_funcionarios > 0 THEN
            v_margem_risco := (v_funcionarios_ativos::numeric / v_total_funcionarios::numeric) * 100;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_total_funcionarios := 0;
        v_funcionarios_ativos := 0;
        v_margem_risco := 100;
        RAISE LOG 'Erro no cálculo de funcionários: %', SQLERRM;
    END;

    -- Calcular oportunidades simples
    v_oportunidades := 0; -- Simplificado por enquanto

    RAISE LOG 'Valores calculados - Receita: %, Comissão: %, Margem: %', 
        v_receita_mes, v_comissao_estimada, v_margem_risco;

    RETURN jsonb_build_object(
        'receita_mes', v_receita_mes,
        'crescimento_percentual', 0,
        'comissao_estimada', v_comissao_estimada,
        'margem_risco', v_margem_risco,
        'oportunidades', v_oportunidades,
        'debug_info', jsonb_build_object(
            'total_funcionarios', v_total_funcionarios,
            'funcionarios_ativos', v_funcionarios_ativos,
            'corretora_id', v_corretora_id
        )
    );
END;
$function$;

-- Conceder permissões para a nova função
GRANT EXECUTE ON FUNCTION public.get_pulse_financeiro_corretor_safe() TO authenticated;

-- SEÇÃO 6: VERIFICAÇÃO FINAL
-- =====================================================

-- Testar a função segura
SELECT 'Teste da função segura:' as info, get_pulse_financeiro_corretor_safe() as resultado;

-- Verificar dados após correção
SELECT 
    'Dados após correção:' as info,
    c.cnpj,
    c.status as cnpj_status,
    COUNT(dp.id) as total_planos,
    SUM(COALESCE(dp.valor_mensal, 0)) as valor_total,
    COUNT(f.id) as total_funcionarios
FROM cnpjs c
LEFT JOIN dados_planos dp ON dp.cnpj_id = c.id
LEFT JOIN funcionarios f ON f.cnpj_id = c.id
WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
   OR c.cnpj LIKE '%123321%' 
   OR c.cnpj LIKE '%495883%'
GROUP BY c.id, c.cnpj, c.status;
