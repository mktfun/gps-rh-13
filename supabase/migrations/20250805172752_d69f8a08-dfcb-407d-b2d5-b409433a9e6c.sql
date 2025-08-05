
-- 1. Adicionar colunas necessárias na tabela mensagens
ALTER TABLE public.mensagens
ADD COLUMN tipo TEXT NOT NULL DEFAULT 'texto';

ALTER TABLE public.mensagens
ADD COLUMN metadata JSONB;

-- 2. Criar o bucket para anexos do chat
INSERT INTO storage.buckets (id, name, public)
VALUES ('anexos_chat', 'anexos_chat', false);

-- 3. Criar políticas de segurança para o bucket anexos_chat
-- Política de SELECT (Download): Permite que participantes baixem arquivos
CREATE POLICY "Participantes podem ler anexos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'anexos_chat' AND
  auth.uid() IN (
    SELECT CASE 
      WHEN c.corretora_id = auth.uid() THEN auth.uid()
      WHEN p.empresa_id = c.empresa_id AND p.id = auth.uid() THEN auth.uid()
      ELSE NULL::uuid
    END
    FROM conversas c
    LEFT JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = (storage.foldername(name))[1]::uuid
  )
);

-- Política de INSERT (Upload): Permite que participantes enviem arquivos
CREATE POLICY "Participantes podem enviar anexos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'anexos_chat' AND
  auth.uid() IN (
    SELECT CASE 
      WHEN c.corretora_id = auth.uid() THEN auth.uid()
      WHEN p.empresa_id = c.empresa_id AND p.id = auth.uid() THEN auth.uid()
      ELSE NULL::uuid
    END
    FROM conversas c
    LEFT JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = (storage.foldername(name))[1]::uuid
  )
);

-- 4. Política de DELETE (opcional, para permitir remoção de arquivos)
CREATE POLICY "Participantes podem deletar seus próprios anexos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'anexos_chat' AND
  owner = auth.uid()
);
