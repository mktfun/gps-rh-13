
-- Verificar se os status 'edicao_solicitada' e 'exclusao_solicitada' existem no enum funcionario_status
-- Se não existirem, adicionar ao enum
DO $$ 
BEGIN
    -- Verificar se o valor 'edicao_solicitada' existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'edicao_solicitada' 
        AND enumtypid = 'funcionario_status'::regtype
    ) THEN
        ALTER TYPE funcionario_status ADD VALUE 'edicao_solicitada';
    END IF;
    
    -- Verificar se o valor 'exclusao_solicitada' existe  
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'exclusao_solicitada' 
        AND enumtypid = 'funcionario_status'::regtype
    ) THEN
        ALTER TYPE funcionario_status ADD VALUE 'exclusao_solicitada';
    END IF;
END $$;

-- Adicionar coluna dados_pendentes para armazenar alterações propostas (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'funcionarios' AND column_name = 'dados_pendentes'
    ) THEN
        ALTER TABLE funcionarios ADD COLUMN dados_pendentes JSONB;
    END IF;
END $$;
