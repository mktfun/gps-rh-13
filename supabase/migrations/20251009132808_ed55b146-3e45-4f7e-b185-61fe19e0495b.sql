-- Atualizar função criar_funcionario_com_planos para incluir data_admissao
CREATE OR REPLACE FUNCTION public.criar_funcionario_com_planos(
    p_nome TEXT,
    p_cpf TEXT,
    p_data_nascimento DATE,
    p_cargo TEXT,
    p_salario NUMERIC,
    p_estado_civil estado_civil,
    p_cnpj_id UUID,
    p_data_admissao DATE DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_incluir_saude BOOLEAN DEFAULT FALSE,
    p_incluir_vida BOOLEAN DEFAULT FALSE
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_funcionario_id UUID;
    v_plano_saude_id UUID;
    v_plano_vida_id UUID;
    v_pendencias_criadas INT := 0;
    v_corretora_id UUID;
BEGIN
    SET search_path = 'public';
    
    -- Buscar a corretora dona do CNPJ
    SELECT e.corretora_id INTO v_corretora_id
    FROM cnpjs c
    JOIN empresas e ON e.id = c.empresa_id
    WHERE c.id = p_cnpj_id;
    
    IF v_corretora_id IS NULL THEN
        RAISE EXCEPTION 'CNPJ não encontrado ou não possui corretora associada';
    END IF;
    
    -- Inserir o funcionário
    INSERT INTO funcionarios (
        nome,
        cpf,
        data_nascimento,
        data_admissao,
        cargo,
        salario,
        estado_civil,
        email,
        cnpj_id,
        status,
        idade
    ) VALUES (
        p_nome,
        p_cpf,
        p_data_nascimento,
        p_data_admissao,
        p_cargo,
        p_salario,
        p_estado_civil,
        p_email,
        p_cnpj_id,
        'ativo',
        EXTRACT(YEAR FROM AGE(p_data_nascimento))
    )
    RETURNING id INTO v_funcionario_id;
    
    -- Se incluir plano de saúde, buscar o plano e criar pendência
    IF p_incluir_saude THEN
        SELECT id INTO v_plano_saude_id
        FROM dados_planos
        WHERE cnpj_id = p_cnpj_id
        AND tipo_seguro = 'saude'
        LIMIT 1;
        
        IF v_plano_saude_id IS NOT NULL THEN
            INSERT INTO pendencias (
                tipo,
                tipo_plano,
                cnpj_id,
                funcionario_id,
                corretora_id,
                status,
                descricao,
                protocolo,
                data_vencimento
            ) VALUES (
                'ativacao',
                'saude',
                p_cnpj_id,
                v_funcionario_id,
                v_corretora_id,
                'pendente',
                'Ativação de funcionário no plano de saúde: ' || p_nome,
                'PEND-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8),
                CURRENT_DATE + INTERVAL '7 days'
            );
            v_pendencias_criadas := v_pendencias_criadas + 1;
        END IF;
    END IF;
    
    -- Se incluir plano de vida, buscar o plano e criar pendência
    IF p_incluir_vida THEN
        SELECT id INTO v_plano_vida_id
        FROM dados_planos
        WHERE cnpj_id = p_cnpj_id
        AND tipo_seguro = 'vida'
        LIMIT 1;
        
        IF v_plano_vida_id IS NOT NULL THEN
            INSERT INTO pendencias (
                tipo,
                tipo_plano,
                cnpj_id,
                funcionario_id,
                corretora_id,
                status,
                descricao,
                protocolo,
                data_vencimento
            ) VALUES (
                'ativacao',
                'vida',
                p_cnpj_id,
                v_funcionario_id,
                v_corretora_id,
                'pendente',
                'Ativação de funcionário no plano de vida: ' || p_nome,
                'PEND-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::TEXT, 1, 8),
                CURRENT_DATE + INTERVAL '7 days'
            );
            v_pendencias_criadas := v_pendencias_criadas + 1;
        END IF;
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'funcionario_id', v_funcionario_id,
        'pendencias_criadas', v_pendencias_criadas
    );
END;
$$;