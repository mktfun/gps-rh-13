
-- PASSO 1: Criar a tabela para os assuntos de atendimento
CREATE TABLE public.assuntos_atendimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  mensagem_padrao TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS na nova tabela
ALTER TABLE public.assuntos_atendimento ENABLE ROW LEVEL SECURITY;

-- Permitir que todos os usuários autenticados leiam os assuntos
CREATE POLICY "Allow authenticated read access to assuntos"
ON public.assuntos_atendimento FOR SELECT
TO authenticated
USING (true);

-- PASSO 2: Popular a tabela com alguns assuntos de exemplo (seeds)
INSERT INTO public.assuntos_atendimento (nome, mensagem_padrao) VALUES
  ('Dúvidas sobre Faturamento', 'Olá, gostaria de tirar uma dúvida sobre meu faturamento.'),
  ('Problemas Técnicos', 'Olá, estou enfrentando um problema técnico e preciso de ajuda.'),
  ('Alteração de Plano', 'Gostaria de solicitar informações sobre como alterar meu plano atual.'),
  ('Outros Assuntos', 'Olá, meu contato é sobre outro assunto.');

-- PASSO 3: Adicionar a coluna de protocolo na tabela de conversas
ALTER TABLE public.conversas
ADD COLUMN protocolo TEXT;

-- Criar um índice para otimizar a busca por protocolo no futuro
CREATE INDEX idx_conversas_protocolo ON public.conversas(protocolo);

-- Adicionar a restrição UNIQUE para garantir que não haja protocolos duplicados
-- Fazemos isso depois de criar o índice para maior eficiência
ALTER TABLE public.conversas
ADD CONSTRAINT conversas_protocolo_unique UNIQUE (protocolo);
