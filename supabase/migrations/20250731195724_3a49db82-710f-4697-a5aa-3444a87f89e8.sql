
-- Adiciona a coluna 'lida' na tabela de mensagens para rastrear o status de leitura
ALTER TABLE public.mensagens ADD COLUMN lida BOOLEAN DEFAULT FALSE;

-- Adiciona uma constraint UNIQUE para garantir que não possa existir mais de uma conversa entre a mesma corretora e empresa
ALTER TABLE public.conversas ADD CONSTRAINT conversas_corretora_empresa_unique UNIQUE (corretora_id, empresa_id);

-- Adiciona uma constraint CHECK para impedir a inserção de mensagens vazias no banco de dados
ALTER TABLE public.mensagens ADD CONSTRAINT conteudo_not_empty CHECK (char_length(conteudo) > 0);
