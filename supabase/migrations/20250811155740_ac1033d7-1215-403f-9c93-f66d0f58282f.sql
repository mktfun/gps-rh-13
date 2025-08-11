
-- PASSO 1: Remover a restrição antiga que só permite um plano por CNPJ
ALTER TABLE public.dados_planos DROP CONSTRAINT IF EXISTS uk_dados_planos_cnpj_id;

-- PASSO 2: Criar a nova restrição correta: permite um plano POR TIPO para cada CNPJ
ALTER TABLE public.dados_planos ADD CONSTRAINT uk_dados_planos_cnpj_id_tipo_seguro UNIQUE (cnpj_id, tipo_seguro);
