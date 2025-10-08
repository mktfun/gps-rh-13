-- PASSO 1: MATAR O PASSADO (TRIGGER, FUNÇÃO E ÍNDICE ANTIGOS)

-- Deleta o trigger que cria pendências automaticamente. ADEUS, FANTASMA.
DROP TRIGGER IF EXISTS "trg_criar_pendencia_ativacao" ON "public"."funcionarios";

-- Deleta a função inútil que o trigger chamava.
DROP FUNCTION IF EXISTS "public"."criar_pendencia_ativacao_apos_inserir_funcionario"();

-- Deleta o índice único burro que não diferenciava os planos.
DROP INDEX IF EXISTS "public"."uniq_pend_ativacao_por_funcionario_pendente";

-- Deleta as funções antigas para podermos recriar com novo retorno
DROP FUNCTION IF EXISTS public.criar_funcionario_com_planos(text,text,date,text,numeric,estado_civil,text,uuid,boolean,boolean);
DROP FUNCTION IF EXISTS public.solicitar_ativacao_plano_existente(uuid,text);


-- PASSO 2: PREPARAR O FUTURO (MELHORAR A TABELA PENDENCIAS)

-- Cria um tipo ENUM para garantir que só teremos 'saude' ou 'vida'. Fim da bagunça com texto.
DO $$ BEGIN
  CREATE TYPE "public"."tipo_plano" AS ENUM ('saude', 'vida');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adiciona a nova coluna na tabela de pendências. AGORA SIM, CARALHO.
ALTER TABLE "public"."pendencias"
ADD COLUMN IF NOT EXISTS "tipo_plano" "public"."tipo_plano";

-- Atualiza os registros existentes (se houver) para preencher a nova coluna com base na descrição.
-- Isso é pra não foder os dados que já existem.
UPDATE "public"."pendencias"
SET "tipo_plano" = 'saude'
WHERE "tipo" = 'ativacao' AND "descricao" ILIKE '%saúde%' AND "tipo_plano" IS NULL;

UPDATE "public"."pendencias"
SET "tipo_plano" = 'vida'
WHERE "tipo" = 'ativacao' AND ("descricao" ILIKE '%vida%' OR "descricao" ILIKE '%seguro%') AND "tipo_plano" IS NULL;


-- PASSO 3: CRIAR O ÍNDICE ÚNICO INTELIGENTE

-- Este novo índice impede duplicatas POR FUNCIONÁRIO E POR TIPO DE PLANO. Agora sim.
DROP INDEX IF EXISTS "public"."idx_uniq_pendencia_ativacao_por_func_e_tipo";
CREATE UNIQUE INDEX "idx_uniq_pendencia_ativacao_por_func_e_tipo"
ON "public"."pendencias" ("funcionario_id", "tipo_plano")
WHERE ("status" = 'pendente' AND "tipo" = 'ativacao' AND "tipo_plano" IS NOT NULL);


-- ATUALIZAÇÃO DA RPC PARA CRIAR FUNCIONÁRIO (Problema #2)
-- Agora ela vai inserir o tipo_plano corretamente.
CREATE OR REPLACE FUNCTION public.criar_funcionario_com_planos(
    p_nome TEXT, 
    p_cpf TEXT, 
    p_data_nascimento DATE, 
    p_cargo TEXT, 
    p_salario NUMERIC,
    p_estado_civil estado_civil, 
    p_email TEXT, 
    p_cnpj_id UUID, 
    p_incluir_saude BOOLEAN DEFAULT false, 
    p_incluir_vida BOOLEAN DEFAULT false
)
RETURNS JSONB 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
    novo_funcionario_id UUID;
    pendencias_criadas INT := 0;
    corretora_responsavel_id UUID;
    v_idade INTEGER;
BEGIN
    SET search_path = 'public';
    
    -- Calcular idade
    v_idade := EXTRACT(YEAR FROM AGE(p_data_nascimento));
    
    -- Inserir funcionário
    INSERT INTO public.funcionarios (
        nome, cpf, data_nascimento, idade, cargo, salario, estado_civil, email, cnpj_id, status
    )
    VALUES (
        p_nome, p_cpf, p_data_nascimento, v_idade, p_cargo, p_salario, p_estado_civil, p_email, p_cnpj_id, 'pendente'
    )
    RETURNING id INTO novo_funcionario_id;

    -- Buscar corretora responsável
    SELECT e.corretora_id 
    INTO corretora_responsavel_id 
    FROM public.empresas e 
    JOIN public.cnpjs c ON e.id = c.empresa_id 
    WHERE c.id = p_cnpj_id;
    
    IF corretora_responsavel_id IS NULL THEN 
        RAISE EXCEPTION 'Corretora não encontrada para o CNPJ ID %', p_cnpj_id; 
    END IF;

    -- Criar pendência de saúde se solicitado
    IF p_incluir_saude THEN
        INSERT INTO public.pendencias (
            cnpj_id, corretora_id, funcionario_id, tipo, descricao, status, protocolo, data_vencimento, tipo_plano
        )
        VALUES (
            p_cnpj_id, 
            corretora_responsavel_id, 
            novo_funcionario_id, 
            'ativacao', 
            'Ativar funcionário ' || p_nome || ' no plano de saúde.', 
            'pendente', 
            'PEND-' || substr(md5(random()::text), 0, 7), 
            NOW() + INTERVAL '7 days', 
            'saude'
        );
        pendencias_criadas := pendencias_criadas + 1;
    END IF;

    -- Criar pendência de vida se solicitado
    IF p_incluir_vida THEN
        INSERT INTO public.pendencias (
            cnpj_id, corretora_id, funcionario_id, tipo, descricao, status, protocolo, data_vencimento, tipo_plano
        )
        VALUES (
            p_cnpj_id, 
            corretora_responsavel_id, 
            novo_funcionario_id, 
            'ativacao', 
            'Ativar funcionário ' || p_nome || ' no seguro de vida.', 
            'pendente', 
            'PEND-' || substr(md5(random()::text), 0, 7), 
            NOW() + INTERVAL '7 days', 
            'vida'
        );
        pendencias_criadas := pendencias_criadas + 1;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE, 
        'funcionario_id', novo_funcionario_id, 
        'pendencias_criadas', pendencias_criadas
    );
END;
$$ LANGUAGE plpgsql;


-- ATUALIZAÇÃO DA RPC PARA INCLUIR EM PLANO EXISTENTE (Problema #1)
-- Agora ela verifica usando a coluna tipo_plano, muito mais limpo.
CREATE OR REPLACE FUNCTION public.solicitar_ativacao_plano_existente(
    p_funcionario_id UUID,
    p_tipo_plano TEXT -- Recebe 'saude' ou 'vida' do frontend
)
RETURNS JSONB 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
    v_tipo_plano_enum tipo_plano := p_tipo_plano::tipo_plano;
    v_cnpj_id UUID;
    v_corretora_id UUID;
    v_nome_funcionario TEXT;
BEGIN
    SET search_path = 'public';
    
    -- Verifica se já existe uma pendência ou vínculo ativo. AGORA USANDO A COLUNA CERTA.
    IF EXISTS (
        SELECT 1 FROM public.pendencias p
        WHERE p.funcionario_id = p_funcionario_id
        AND p.tipo = 'ativacao'
        AND p.status = 'pendente'
        AND p.tipo_plano = v_tipo_plano_enum
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Este funcionário já possui uma pendência de ativação para o plano de ' || p_tipo_plano || '.'
        );
    END IF;
    
    -- Pega os dados necessários para criar a pendência
    SELECT f.cnpj_id, f.nome, e.corretora_id 
    INTO v_cnpj_id, v_nome_funcionario, v_corretora_id
    FROM public.funcionarios f
    JOIN public.cnpjs c ON f.cnpj_id = c.id
    JOIN public.empresas e ON c.empresa_id = e.id
    WHERE f.id = p_funcionario_id;

    IF v_cnpj_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Funcionário não encontrado.'
        );
    END IF;

    -- Cria a pendência
    INSERT INTO public.pendencias (
        cnpj_id, corretora_id, funcionario_id, tipo, descricao, status, protocolo, data_vencimento, tipo_plano
    )
    VALUES (
        v_cnpj_id, 
        v_corretora_id, 
        p_funcionario_id, 
        'ativacao', 
        'Ativar funcionário ' || v_nome_funcionario || ' no plano de ' || p_tipo_plano, 
        'pendente', 
        'PEND-' || substr(md5(random()::text), 0, 7), 
        NOW() + INTERVAL '7 days', 
        v_tipo_plano_enum
    );

    RETURN jsonb_build_object(
        'success', TRUE, 
        'message', 'Pendência de ativação para ' || p_tipo_plano || ' criada com sucesso.'
    );
END;
$$ LANGUAGE plpgsql;