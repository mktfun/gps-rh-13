-- =====================================================
-- SCHEMA DE CORREÇÃO PARA INDICADORES FINANCEIROS
-- =====================================================
-- Execute este script no Supabase SQL Editor para corrigir
-- a estrutura e dados dos indicadores financeiros

-- 1. CRIAÇÃO/CORREÇÃO DAS TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de Corretoras
CREATE TABLE IF NOT EXISTS public.corretoras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255) UNIQUE,
    endereco TEXT,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.empresas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(14) UNIQUE,
    corretora_id UUID REFERENCES public.corretoras(id) ON DELETE CASCADE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de CNPJs
CREATE TABLE IF NOT EXISTS public.cnpjs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
    razao_social VARCHAR(255),
    nome_fantasia VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente', 'bloqueado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Planos (Corrigida)
CREATE TABLE IF NOT EXISTS public.dados_planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj_id UUID REFERENCES public.cnpjs(id) ON DELETE CASCADE,
    seguradora VARCHAR(255) NOT NULL,
    tipo_seguro VARCHAR(50) NOT NULL CHECK (tipo_seguro IN ('vida', 'saude', 'odontologico', 'acidentes')),
    valor_mensal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    valor_adesao DECIMAL(10,2) DEFAULT 0.00,
    comissao_percentual DECIMAL(5,2) DEFAULT 5.00, -- Percentual de comissão
    numero_contrato VARCHAR(100),
    data_inicio DATE,
    data_fim DATE,
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente', 'cancelado')),
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Funcionários
CREATE TABLE IF NOT EXISTS public.funcionarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cnpj_id UUID REFERENCES public.cnpjs(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(11) UNIQUE NOT NULL,
    data_nascimento DATE,
    idade INTEGER,
    cargo VARCHAR(255),
    salario DECIMAL(10,2),
    email VARCHAR(255),
    telefone VARCHAR(20),
    estado_civil VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente', 'afastado', 'demitido')),
    data_admissao DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de Relacionamento Planos-Funcionários
CREATE TABLE IF NOT EXISTS public.planos_funcionarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plano_id UUID REFERENCES public.dados_planos(id) ON DELETE CASCADE,
    funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
    data_inclusao DATE DEFAULT CURRENT_DATE,
    data_exclusao DATE,
    valor_individual DECIMAL(10,2), -- Valor específico para este funcionário (se aplicável)
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pendente', 'cancelado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(plano_id, funcionario_id)
);

-- 2. ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_empresas_corretora ON public.empresas(corretora_id);
CREATE INDEX IF NOT EXISTS idx_cnpjs_empresa ON public.cnpjs(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cnpjs_status ON public.cnpjs(status);
CREATE INDEX IF NOT EXISTS idx_dados_planos_cnpj ON public.dados_planos(cnpj_id);
CREATE INDEX IF NOT EXISTS idx_dados_planos_tipo ON public.dados_planos(tipo_seguro);
CREATE INDEX IF NOT EXISTS idx_dados_planos_status ON public.dados_planos(status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_cnpj ON public.funcionarios(cnpj_id);
CREATE INDEX IF NOT EXISTS idx_funcionarios_status ON public.funcionarios(status);
CREATE INDEX IF NOT EXISTS idx_planos_funcionarios_plano ON public.planos_funcionarios(plano_id);
CREATE INDEX IF NOT EXISTS idx_planos_funcionarios_funcionario ON public.planos_funcionarios(funcionario_id);

-- 3. DADOS DE EXEMPLO/TESTE CORRIGIDOS
-- =====================================================

-- Inserir corretora de teste
INSERT INTO public.corretoras (id, nome, cnpj, email, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Corretora Teste',
    '12345678000199',
    'teste@corretora.com',
    'ativo'
) ON CONFLICT (email) DO NOTHING;

-- Inserir empresas de teste
INSERT INTO public.empresas (id, nome, cnpj, corretora_id, status)
VALUES 
    (
        '00000000-0000-0000-0000-000000000002',
        'TESTE',
        '12332132135000',
        '00000000-0000-0000-0000-000000000001',
        'ativo'
    ),
    (
        '00000000-0000-0000-0000-000000000003', 
        'TESTE 123',
        '49588365900187',
        '00000000-0000-0000-0000-000000000001',
        'ativo'
    )
ON CONFLICT (cnpj) DO UPDATE SET 
    corretora_id = EXCLUDED.corretora_id,
    status = 'ativo',
    updated_at = now();

-- Inserir CNPJs de teste
INSERT INTO public.cnpjs (id, cnpj, empresa_id, razao_social, status)
VALUES 
    (
        '00000000-0000-0000-0000-000000000004',
        '12332132135',
        '00000000-0000-0000-0000-000000000002',
        'TESTE LTDA',
        'ativo'
    ),
    (
        '00000000-0000-0000-0000-000000000005',
        '49588365900187',
        '00000000-0000-0000-0000-000000000003',
        'TESTE 123 LTDA',
        'ativo'
    )
ON CONFLICT (cnpj) DO UPDATE SET 
    status = 'ativo',
    updated_at = now();

-- Inserir planos de teste com valores corretos
INSERT INTO public.dados_planos (id, cnpj_id, seguradora, tipo_seguro, valor_mensal, comissao_percentual, status)
VALUES 
    (
        '00000000-0000-0000-0000-000000000006',
        '00000000-0000-0000-0000-000000000004',
        'TESTE',
        'vida',
        200.00,
        20.00,
        'ativo'
    ),
    (
        '00000000-0000-0000-0000-000000000007',
        '00000000-0000-0000-0000-000000000004',
        'PORTO SEGURO',
        'saude',
        300.00,
        5.00,
        'ativo'
    ),
    (
        '00000000-0000-0000-0000-000000000008',
        '00000000-0000-0000-0000-000000000005',
        'Porto',
        'vida',
        150.00,
        20.00,
        'ativo'
    )
ON CONFLICT (id) DO UPDATE SET 
    valor_mensal = EXCLUDED.valor_mensal,
    comissao_percentual = EXCLUDED.comissao_percentual,
    status = 'ativo',
    updated_at = now();

-- Inserir funcionários de teste
INSERT INTO public.funcionarios (id, cnpj_id, nome, cpf, cargo, salario, status)
VALUES 
    ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'João Silva', '12345678901', 'Desenvolvedor', 5000.00, 'ativo'),
    ('00000000-0000-0000-0000-00000000000A', '00000000-0000-0000-0000-000000000004', 'Maria Santos', '12345678902', 'Analista', 4000.00, 'ativo'),
    ('00000000-0000-0000-0000-00000000000B', '00000000-0000-0000-0000-000000000004', 'Pedro Costa', '12345678903', 'Gerente', 7000.00, 'ativo'),
    ('00000000-0000-0000-0000-00000000000C', '00000000-0000-0000-0000-000000000004', 'Ana Lima', '12345678904', 'Assistente', 3000.00, 'ativo'),
    ('00000000-0000-0000-0000-00000000000D', '00000000-0000-0000-0000-000000000005', 'Carlos Souza', '12345678905', 'Diretor', 8000.00, 'ativo')
ON CONFLICT (cpf) DO UPDATE SET 
    status = 'ativo',
    updated_at = now();

-- 4. FUNÇÃO FINANCEIRA CORRIGIDA
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pulse_financeiro_corretor()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_corretora_id uuid := auth.uid();
    v_receita_mes numeric := 0;
    v_receita_mes_anterior numeric := 0;
    v_comissao_estimada numeric := 0;
    v_margem_risco numeric := 0;
    v_oportunidades numeric := 0;
    v_crescimento_percentual numeric := 0;
    v_total_funcionarios integer := 0;
    v_funcionarios_ativos integer := 0;
    v_cnpjs_sem_seguro_vida integer := 0;
BEGIN
    -- Debug: Log do corretor ID
    RAISE LOG 'Calculando pulse para corretora: %', v_corretora_id;
    
    -- Receita mensal TOTAL de todos os planos ativos
    SELECT COALESCE(SUM(dp.valor_mensal), 0) 
    INTO v_receita_mes
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.status = 'ativo'
    AND dp.valor_mensal > 0;

    -- Receita do mês anterior (para cálculo de crescimento)
    SELECT COALESCE(SUM(dp.valor_mensal), 0) 
    INTO v_receita_mes_anterior
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.status = 'ativo'
    AND dp.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND dp.created_at < DATE_TRUNC('month', CURRENT_DATE);

    -- Comissão estimada baseada no percentual de cada plano
    SELECT COALESCE(SUM(dp.valor_mensal * (dp.comissao_percentual / 100)), 0) 
    INTO v_comissao_estimada
    FROM dados_planos dp
    INNER JOIN cnpjs c ON dp.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.status = 'ativo'
    AND dp.valor_mensal > 0;

    -- Contagem total de funcionários
    SELECT COUNT(f.id) 
    INTO v_total_funcionarios
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo';

    -- Contagem de funcionários ativos
    SELECT COUNT(f.id) 
    INTO v_funcionarios_ativos
    FROM funcionarios f
    INNER JOIN cnpjs c ON f.cnpj_id = c.id
    INNER JOIN empresas e ON c.empresa_id = e.id
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND f.status = 'ativo';

    -- Margem de risco (funcionários ativos vs total)
    IF v_total_funcionarios > 0 THEN
        v_margem_risco := (v_funcionarios_ativos::numeric / v_total_funcionarios::numeric) * 100;
    ELSE
        v_margem_risco := 100;
    END IF;

    -- Oportunidades (CNPJs sem plano de seguro de vida)
    SELECT COUNT(DISTINCT c.id) 
    INTO v_cnpjs_sem_seguro_vida
    FROM cnpjs c
    INNER JOIN empresas e ON c.empresa_id = e.id
    LEFT JOIN dados_planos dp ON (dp.cnpj_id = c.id AND dp.tipo_seguro = 'vida' AND dp.status = 'ativo')
    WHERE e.corretora_id = v_corretora_id
    AND c.status = 'ativo'
    AND dp.id IS NULL;

    v_oportunidades := v_cnpjs_sem_seguro_vida * 150; -- R$ 150 por CNPJ sem seguro de vida

    -- Calcular crescimento percentual
    IF v_receita_mes_anterior > 0 THEN
        v_crescimento_percentual := ((v_receita_mes - v_receita_mes_anterior) / v_receita_mes_anterior) * 100;
    ELSE
        v_crescimento_percentual := 0;
    END IF;

    -- Debug: Log dos valores calculados
    RAISE LOG 'Receita: %, Comissão: %, Margem: %, Oportunidades: %', 
        v_receita_mes, v_comissao_estimada, v_margem_risco, v_oportunidades;

    RETURN jsonb_build_object(
        'receita_mes', v_receita_mes,
        'crescimento_percentual', v_crescimento_percentual,
        'comissao_estimada', v_comissao_estimada,
        'margem_risco', v_margem_risco,
        'oportunidades', v_oportunidades,
        'debug', jsonb_build_object(
            'total_funcionarios', v_total_funcionarios,
            'funcionarios_ativos', v_funcionarios_ativos,
            'cnpjs_sem_vida', v_cnpjs_sem_seguro_vida,
            'receita_mes_anterior', v_receita_mes_anterior
        )
    );
END;
$function$;

-- 5. CORREÇÕES DE DADOS EXISTENTES
-- =====================================================

-- Ativar todos os CNPJs de teste
UPDATE public.cnpjs 
SET status = 'ativo', updated_at = now()
WHERE cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
OR cnpj LIKE '%123321%' 
OR cnpj LIKE '%495883%';

-- Corrigir valores zerados nos planos
UPDATE public.dados_planos 
SET 
    valor_mensal = CASE 
        WHEN tipo_seguro = 'vida' THEN 150.00
        WHEN tipo_seguro = 'saude' THEN 300.00
        ELSE 100.00
    END,
    comissao_percentual = CASE 
        WHEN tipo_seguro = 'vida' THEN 20.00
        ELSE 5.00
    END,
    status = 'ativo',
    updated_at = now()
WHERE (valor_mensal IS NULL OR valor_mensal = 0 OR status != 'ativo')
AND cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
);

-- Ativar funcionários pendentes
UPDATE public.funcionarios 
SET status = 'ativo', updated_at = now()
WHERE status != 'ativo' 
AND cnpj_id IN (
    SELECT c.id 
    FROM cnpjs c 
    WHERE c.cnpj IN ('12332132135', '49588365900187', '123321321350', '495883659001870')
       OR c.cnpj LIKE '%123321%' 
       OR c.cnpj LIKE '%495883%'
);

-- 6. PERMISSÕES E POLÍTICAS RLS
-- =====================================================

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.corretoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cnpjs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dados_planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos_funcionarios ENABLE ROW LEVEL SECURITY;

-- Política para corretoras (usuário só vê suas próprias empresas)
CREATE POLICY "Corretoras podem ver suas próprias empresas" ON public.empresas
FOR ALL USING (corretora_id = auth.uid());

-- Política para CNPJs
CREATE POLICY "Corretoras podem ver CNPJs de suas empresas" ON public.cnpjs
FOR ALL USING (
    empresa_id IN (
        SELECT id FROM public.empresas WHERE corretora_id = auth.uid()
    )
);

-- Política para planos
CREATE POLICY "Corretoras podem ver planos de seus CNPJs" ON public.dados_planos
FOR ALL USING (
    cnpj_id IN (
        SELECT c.id FROM public.cnpjs c
        INNER JOIN public.empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = auth.uid()
    )
);

-- Política para funcionários
CREATE POLICY "Corretoras podem ver funcionários de seus CNPJs" ON public.funcionarios
FOR ALL USING (
    cnpj_id IN (
        SELECT c.id FROM public.cnpjs c
        INNER JOIN public.empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = auth.uid()
    )
);

-- Política para relacionamento planos-funcionários
CREATE POLICY "Corretoras podem ver relacionamentos de seus planos" ON public.planos_funcionarios
FOR ALL USING (
    plano_id IN (
        SELECT dp.id FROM public.dados_planos dp
        INNER JOIN public.cnpjs c ON dp.cnpj_id = c.id
        INNER JOIN public.empresas e ON c.empresa_id = e.id
        WHERE e.corretora_id = auth.uid()
    )
);

-- Conceder permissões para usuários autenticados
GRANT ALL ON public.corretoras TO authenticated;
GRANT ALL ON public.empresas TO authenticated;
GRANT ALL ON public.cnpjs TO authenticated;
GRANT ALL ON public.dados_planos TO authenticated;
GRANT ALL ON public.funcionarios TO authenticated;
GRANT ALL ON public.planos_funcionarios TO authenticated;

-- Conceder execução da função
GRANT EXECUTE ON FUNCTION public.get_pulse_financeiro_corretor() TO authenticated;

-- 7. TRIGGERS PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Criar triggers para todas as tabelas
DROP TRIGGER IF EXISTS update_corretoras_updated_at ON public.corretoras;
CREATE TRIGGER update_corretoras_updated_at BEFORE UPDATE ON public.corretoras FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_empresas_updated_at ON public.empresas;
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_cnpjs_updated_at ON public.cnpjs;
CREATE TRIGGER update_cnpjs_updated_at BEFORE UPDATE ON public.cnpjs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_dados_planos_updated_at ON public.dados_planos;
CREATE TRIGGER update_dados_planos_updated_at BEFORE UPDATE ON public.dados_planos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_funcionarios_updated_at ON public.funcionarios;
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.funcionarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_planos_funcionarios_updated_at ON public.planos_funcionarios;
CREATE TRIGGER update_planos_funcionarios_updated_at BEFORE UPDATE ON public.planos_funcionarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 8. VERIFICAÇÃO FINAL
-- =====================================================

-- Query para testar os valores após a correção
SELECT 
    'TESTE DE VERIFICAÇÃO' as tipo,
    get_pulse_financeiro_corretor() as resultado_financeiro;

-- Query para ver todos os planos ativos
SELECT 
    c.cnpj,
    dp.seguradora,
    dp.tipo_seguro,
    dp.valor_mensal,
    dp.comissao_percentual,
    dp.status
FROM dados_planos dp
JOIN cnpjs c ON dp.cnpj_id = c.id
JOIN empresas e ON c.empresa_id = e.id
WHERE dp.status = 'ativo'
ORDER BY c.cnpj, dp.tipo_seguro;
